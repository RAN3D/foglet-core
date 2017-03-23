/*
MIT License

Copyright (c) 2016 Grall Arnaud

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
'use strict';

const _ = require('lodash');
const EventEmitter = require('events');
const N2N = require('n2n-overlay-wrtc');
const io = require('socket.io-client');

/**
 * Socket class, we provide a high level api to use the packages n2n-overlay-wrtc and neighborhood-wrtc,
 * in order to connect easily a socket to another socket by WebRTC, using either a directCallback
 * if you provide a socket for the method 'connection(socket)' or  a signalingCallback to socket.io server
 * You can customize signals to answer to the signaling server.
 * A signaling server example is provided (see {@link https://www.npmjs.com/package/foglet-signaling-server})
 * See {@link https://www.npmjs.com/package/foglet-signaling-server}
 * @example
 * const Socket = require('./socket.js');
 * let a = new Socket();
 * let b = new Socket();
 *
 * // Direct connection
 * a.connection(b);
 *
 * // Connection with the signaling server listening (by default) on http://localhost:3000/
 * let c = new Socket();
 * let d = new Socket();
 * c.on('onReady', (data) => {
 *	this.log('Connected : ', data);
 * });
 * d.on('onReady', (data) => {
 *	this.log('Connected : ', data);
 * });
 * c.on('joinedRoom', () => {
 *	this.log(d.connection());
 * });
 * d.on('joinedRoom', () => {
 *	this.log(c.connection());
 * });
 * c.join('mywonderfulroom');
 * d.join('mywonderfulroom');
 */
class Socket extends EventEmitter {
	/**
	 * @constructor
	 * @param {object} options Options
	 * @param {object} options.neighborhood neighborhood options
	 * @param {object} options.neighborhood.webrtc WebRTC options
	 * @param {string} options.neighborhood.protocol name of the protocol, it can be anything you want
	 * @param {string} options.neighborhood.encoding encoding method to encode the message to send (be sure to be in harmony with the decoding method)
	 * @param {string} options.neighborhood.decoding decoding method to decode the received message (be sure to be in harmony with the encoding method)
	 * @param {string} options.signalOffer Use to emit the new offer
	 * @param {string} options.signalAccept Use to emit the accepted offer
	 * @param {string} options.signalOnOffer Use to receive the new offer
	 * @param {string} options.signalOnAccept Use to receive the accepted offer
	 * @param {string} options.signalOnReady Use to emit the id of the new connected socket
	 * @param {string} options.signalingAdress Signaling server adress, default to http://localhost:3000/
	 * @param {string} options.signalRoom Room to join on the signaling server
	 * @param {string} options.signalOnRoom Signal use when we receive a join emit from the server
	 * @param {string} options.signalLeave Signal use when to leave the room
	 * @param {string} options.verbose Dont want to log ? set this to false
	 * @example
	 * defaultOptions = {
	 * 	neighborhood: {
	 * 		webrtc: {
	 *	 		trickle: true
	 *  	},
	 * 		protocol: 'SocketDefaultProtocol'
	 * 	},
	 *	signalOffer: 'offer',
	 *	signalAccept: 'accept',
	 *	signalOnOffer: 'onOffer',
	 *	signalOnAccept: 'onAccept',
	 *	signalOnReady: 'onReady',
	 *	signalingAdress: 'http://localhost:3000',
	 *	signalRoom: 'joinRoom',
	 *	signalOnRoom: 'joinedRoom',
	 *	verbose: true
	 * };
	 */
	constructor (options) {
		super();
		this.defaultOptions = {
			neighborhood: {
				webrtc: {
					trickle: false,
					iceServers : [
						{
							urls: 'stun:stun.l.google.com:19302' // stun server by default
						},
					]
				},
				protocol: 'SocketDefaultProtocol',
				encoding: (message) => {
					return JSON.stringify(message);
					// return new Buffer('message');
				},
				decoding: (message) => {
					return JSON.parse(message);
				}
			},
			signalOffer: 'offer',
			signalAccept: 'accept',
			signalOnOffer: 'onOffer',
			signalOnAccept: 'onAccept',
			signalOnReady: 'onReady',
			signalingAdress: 'http://localhost:3000',
			signalRoom: 'joinRoom',
			signalOnRoom: 'joinedRoom',
			signalLeave: 'leaveRoom',
			verbose: true
		};
		this.defaultOptions = _.merge(this.defaultOptions, options);
		this.defaultOptions.neighborhood.protocol = this.defaultOptions.neighborhood.protocol + '-socket-wrtc';
		this._log('Options', this.defaultOptions);

		// =======================================================================================
		// ============================= SIGNALING CALLBACKS AND LISTENERS ========================
		// =======================================================================================
		this.signaling = io.connect(this.defaultOptions.signalingAdress);

		/**
		* Direct callback for a direct connection to another socket
		* @param  {object} src  neighborhood-wrtc object
		* @param  {object} dest neighborhood-wrtc object
		* @return {object} Return an object with all neighborhood-wrtc method we must provide
		*/
		this.directCallback = (src, dest) => {
			return {
				onInitiate: (offer) => {
					dest.connection(this.directCallback(dest, src), offer);
				},
				onAccept: (offer) => {
					dest.connection(offer);
				},
				onReady: (id) => {
					this._onReady(id);
				}
			};
		};
		/**
		* Signaling callback for a connection to a signaling server
		* @param {object} data Optionnal data you can pass to the signaling server
		* @return {object} Return an object with all methods neighborhood-wrtc package want
		*/
		this.signalingCallback = (data) => {
			return {
				onInitiate: (offer) => {
					this._onOffer(offer, data);
				},
				onAccept: (offer) => {
					this._onAccept(offer);
				},
				onReady: (id) => {
					this._onReady(id);
				}
			};
		};
		/**
		 * The signaling server must send the new offer, not the entire object data with the room
		 */
		this.signaling.on(this.defaultOptions.signalOnOffer, (data) => {
			this._log('[signal:'+ this.defaultOptions.signalOnOffer +']', data);
			this.socket.connection(this.signalingCallback(), data.offer);
		});

		/**
		 * The signaling server must send the accepted offer, not the entire object with the room
		 */
		this.signaling.on(this.defaultOptions.signalOnAccept, (data) => {
			this._log('[signal:'+ this.defaultOptions.signalOnAccept +']', data);
			this.socket.connection(data.offer);
		});

		/**
		 * Signaling part where we receive an emit from the server, means that we are in the room
		 */
		this.signaling.on(this.defaultOptions.signalOnRoom, (room) => {
			this._log('[signal:'+this.defaultOptions.signalOnRoom+']', room);
			this.emit(this.defaultOptions.signalOnRoom, 'connected');
		});


		// ========================================================================
		// ============================= CREATE THE SOCKET ========================
		// ========================================================================s
		this.socket = new N2N({
			protocol: this.defaultOptions.neighborhood.protocol
		});
		this.socket.on('error', (error) => this.emit('error', error));

		this.socket.on('receive', (id, message) => this._onReceive(id, message));
		this.socket.on('stream', (id, message) => this._onStream(id, message));

		this.outviewId = this.socket.o.ID;
		this.inviewId = this.socket.i.ID;

		this.room = null;
	}

	/**
	* Connect the initial socket to another if pass as parameter,
	* or init the signaling part for the connection
	* 1) Join the room
	* 2) When receive the signal we initialize the connection
	* @param {Socket} socket The other Socket to connect with
	* @param {object} data It is the offer to pass to the connection, it will use your custom callback
	* @param {callback} customCallback Custom callback use to personalize your connection system. It will use 3 step 'initiate' => 'accept' => 'finalize'
	* @param {string} state State for the custom connection
	* @return {boolean} Return true if the connection was initialize, false otherwise
	*/
	connection (socket, data = undefined, customCallback = undefined, state = 'initiate') {
		if(socket) {
			return this.socket.connection(this.directCallback(this.socket, socket.socket));
		} else if( !socket && !customCallback) {
			return this.socket.connection(this._signalingCallback());
		} else if(customCallback) {
			if(!socket && customCallback && data && state === 'initiate') {
				return this.socket.connection(customCallback(data));
			} else if(!socket && customCallback && data && state === 'accept') {
				return this.socket.connection(customCallback(data), data);
			} else {
				return this.socket.connection(data);
			}
		}
		this._log('[SOCKET:CONNECTION] IMPOSSIBLE');
		return false;
	}

	connect2 (from = null, to = null) {
		this.socket.connect(from, to);
	}

	/**
	 * Emit the room to join to the signaling server
	 * @param {string} room The room to join
	 * @param {callback} callback Callback with the room injected, called after all jobs
	 * @return {void}
	 */
	join (room, callback) {
		this.room = room;
		this.signaling.emit(this.defaultOptions.signalRoom, {id:this.id, room});
		callback && callback(room);
	}

	/**
	 * Leave a room and disconnect, call a callback after all jobs
	 * @param {string} room The room to leave (optionnal), if none we leave the default room
	 * @param {callback} callback Callback with the status of the disconnect method and the status of the socket, (callback(boolean, status))
	 * @return {void}
	 */
	leave (room, callback) {
		if(room) {
			this.signaling.emit(this.defaultOptions.signalLeave, {id: this.id, room});
		} else {
			this.signaling.emit(this.defaultOptions.signalLeave, {id: this.id, room: this.room});
		}
		callback && callback(this.socket.disconnect(), 'disconnected');
	}

	/**
	 * Remove all arcs or just the outview connection provided by id of the arc
	 * @param {string} outviewId Id out the arc to remove or remove all arcs if undefined
	 * @return {boolean} Return true if the disconnection is ok otherwise false;
	 */
	disconnect (outviewId = undefined) {
		this._log('DISCONNECTION OF: ' + outviewId);
		return this.socket.disconnect(outviewId);
	}



	/**
	 * Send a message to the socket id
	 * @param {string} id Socket id to send the message
	 * @param {object} message The message to send
	 * @return {boolean} True if the message has been sent, false otherwise
	 */
	send (id, message) {
		const socket = this.socket.get(id);
		this._log(id, message, socket);
		let res = true;
		if(socket && socket.id) {
			try {
				res = this.socket.send(socket.id, message);
			} catch (e) {
				this._log('Send:error: ', e);
				return false;
			}
		} else {
			return false;
		}
		return res;
	}

	toString () {
		return 'INVIEW:ID = ' + this.inviewId + ' | ' + 'OUTVIEW:ID = ' + this.outviewId;
	}

	/**
	 * Get all living neighbours informations (including socket)
	 * @return {array} Array of all living neighbours
	 */
	getNeighbours () {
		return { inview: this.socket.inview.living.ms.arr, outview: this.socket.outview.living.ms.arr };
		// return _.uniqBy(_.concat(this.socket.inview.living.ms.arr, this.socket.outview.living.ms.arr), 'id');
	}

	/**
	 * Get all living neighbours ID
	 * @return {array} Array of all living neighbours
	 */
	getNeighboursId () {
		let ids = [];
		this.socket.living.ms.arr.forEach(p => ids.push(p.id));
		return ids;
	}

	/**
	 * Emit the new message received
	 * @param {string} id Id of the sender
	 * @param {object} message The message received
	 * @return {object} The response emitted composed with id and the message
	 */
	_onReceive (id, message) {
		const response = { id, message };
		this.emit('receive', response);
	}

	/**
	 * Emit the new message received
	 * @param {string} id Id of the sender
	 * @param {object} message The message received
	 * @return {object} The response emitted composed with id and the message
	 */
	_onStream (id, message) {
		const response = { id, message };
		this._log('[Socket:stream]', response);
		this.emit('stream', response);
	}

	/**
	 * Log method to log anything we want if verbose = true
	 * @param {...object} args objects to log
	 * @return {void}
	 */
	_log (...args) {
		if(this.defaultOptions.verbose) {
			console.log('[Socket:' + this.defaultOptions.neighborhood.protocol + ']', args);
		}
	}

	/**
	 * Transfomr the offer to add the room
	 * @param {object} offer the offer to transform
	 * @param {object} data (Optionnal) data you want to add for the signaling server
	 * @return {object} Return the transform offer or if data is available a merge of the transform object and data
	 */
	_transformOffer (offer, data) {
		if(data) {
			return _.merge({
				offer:offer,
				room: this.room
			}, data);
		}else{
			return {
				offer: offer,
				room: this.room
			};
		}
	}

	/**
	 * Emit the new offer after a little transformation => data sent => {offer, room}
	 * Emit signal : this.defaultOptions.signalOffer
	 * @param {object} offer the offer to send
	 * @param {object} data Other data you want to send to the server
	 * @return {void}
	 */
	_onOffer (offer, data) {
		offer = this._transformOffer(offer, data);
		this._log('[Offer] Emit the offer to the signaling server', offer);
		this.signaling.emit(this.defaultOptions.signalOffer, offer);
	}

	/**
	 * Emit the accepted offer after a little transformation => data sent => {offer, room}
	 * Emit signal : this.defaultOptions.signalAccept
	 * @param {object} offer the offer to send
	 * @return {void}
	 */
	_onAccept (offer) {
		offer = this._transformOffer(offer);
		this._log('[Accept] Emit the accepted offer to the signaling server', offer);
		this.signaling.emit(this.defaultOptions.signalAccept, offer);
	}

	/**
	 * Emit on the signal the id of the new peer, and set the new status
	 * Emit signal : this.defaultOptions.signalOnReady
	 * @param {string} id The id of the client connected
	 * @return {void}
	 */
	_onReady (id) {
		this._log(' New connected peer id : ', id);
		this.emit(this.defaultOptions.signalOnReady, id);
	}

}



module.exports = { Socket };
