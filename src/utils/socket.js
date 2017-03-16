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
const Neighbour = require('neighborhood-wrtc');
const N2N = require('n2n-overlay-wrtc');
const io = require('socket.io-client');
const uuid = require('uuid/v4');
const SimplePeer = require('simple-peer');

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
 *	console.log('Connected : ', data);
 * });
 * d.on('onReady', (data) => {
 *	console.log('Connected : ', data);
 * });
 * c.on('joinedRoom', () => {
 *	console.log(d.connection());
 * });
 * d.on('joinedRoom', () => {
 *	console.log(c.connection());
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
			protocol: this.defaultOptions.neighborhood.protocol,
			inview: new ExtendedNeighborhood(this.defaultOptions.neighborhood),
			outview: new ExtendedNeighborhood(this.defaultOptions.neighborhood)
		});

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
				// initiate
				this._log('Custom callback initiate.', data);
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
		console.log('DISCONNECTION OF: ' + outviewId);
		return this.socket.disconnect(outviewId);
	}



	/**
	 * Send a message to the socket id
	 * @param {string} id Socket id to send the message
	 * @param {object} message The message to send
	 * @return {boolean} True if the message has been sent, false otherwise
	 */
	send (id, message) {
		const socketId = this.socket.get(id);
		if(socketId) {
			this._log('Message sent to : '+ socketId, message);
			return this.socket.send(socketId, message);
		} else {
			return false;
		}
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
		this._log('[Socket:receive]', response);
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

/** =========================================================================
 *	=========================================================================
 * 	========================================================================= */

/**
 * Extended class of neighborhood-wrtc with [en/de]coding features
 * @class ExtendedNeighborhood
 */
class ExtendedNeighborhood extends Neighbour {
	constructor (options) {
		super(options);
		this.encoding = options.encoding;
		this.decoding = options.decoding;
		this.ID = uuid();
		if(this.options.config.wrtc) {
			this.options.wrtc = this.options.config.wrtc;
		}
	}

	MResponse (tid, pid, offer, protocol) {
		return {
			tid: tid,
			pid: pid,
			protocol: protocol,
			type: 'MResponse',
			offer: offer
		};
	}
	MRequest (tid, pid, offer, protocol) {
		return {
			tid: tid,
			pid: pid,
			protocol: protocol,
			type: 'MRequest',
			offer: offer
		};
	}

	/**
	 * New method to encode the message as we want
	 * @param  {object} message The message to encode
	 * @return {string|binary} Encoded message
	 */
	encode (message) {
		return this.encoding(message);
	}

	/**
	 * New method to encode the message as we want
	 * @param  {object} message The message to encode
	 * @return {string|binary} Encoded message
	 */
	decode (message) {
		return this.decoding(message);
	}

	/**
	 * ES6 Transformation of the method, and change the JSON.stringify(message) to use protobuff for a better optimization (see {@link https://github.com/google/protobuf/tree/master/js})
	 */
	/**
	 * Send a message to the socket in argument
	 * @param {string} id the identifier of the socket
	 * @param {object} message the message to send
	 * @return {boolean} true if the message is sent, false otherwise
	 */
	send (id, message) {
		// #1 convert message to string (TODO) check if there is a better way
		let msg = ((message instanceof String) && message) || this.encode(message);
		// #2 get the socket to use
		let entry = this.get(id);
		let socket = entry && entry.socket;
		// #3 send
		let result = msg && socket && socket.connected && socket._channel && (socket._channel.readyState === 'open');
		result && socket.send(msg);
		return result;
	}

	/**
	* creates a new incomming or outgoing connection depending on arguments
	* @param {callback} callbacks the callback function when the stun/ice server returns the
	* offer
	* @param {object} message empty if it must initiate a connection, or the message received
	* if it must answer or finalize one
	* @param {string} protocol the connection is established for a specific protocol
	* @return {string} the id of the socket
	*/
	connection (callbacks, message, protocol) {
		let msg = (callbacks && callbacks.type && callbacks) || message;
		let result;

		if (!msg) {
			result = this.initiate(callbacks, protocol);
		} else if (msg.type==='MRequest') {
			result = this.accept(msg, callbacks);
			result = this.alreadyExists(msg, callbacks) || result;
		} else if (msg.type==='MResponse') {
			result = this.finalize(msg);
			result = this.alreadyExists(msg) || result;
		}

		return result && result.id;
	}

	/**
	 * Common behavior to initiating and accepting sockets
	 * @param {object} entry the entry in the neighborhood table
	 * @return {void}
	 */
	common (entry) {
		const self = this, socket = entry.socket;

		socket.on('data', (message) => {
			message = self.decode(message);
			self.emit('receive', entry.pid, message);
		});
		socket.on('stream', (stream) => {
			self.emit('stream', entry.pid, stream);
		});
		socket.on('error', (err) => {
			console.log('[ERROR:COMMON]', new Error(err));
			console.log('[Socket] :', socket);
		});
	}

	/**
	 * initiates a connection with another peer -- the id of which is unknown
	 * @param {callback} callbacks the function to call when signaling info are received and
	 * when the connection is ready to be used
	 * @param {string} protocol The protocol
	 * @return {object} entry
	 */
	initiate (callbacks, protocol) {
		const self = this;
		let opts = self.options;
		opts.initiator = true;
		let socket = new SimplePeer(opts);
		let entry = {
			id: uuid(),
			socket: socket,
			protocol: protocol,
			successful: false, // not yet
			onOffer: callbacks && callbacks.onInitiate,
			onReady: callbacks && callbacks.onReady
		};

		this.pending.insert(entry);
		socket.on('signal', (offer) => {
			entry.onOffer && entry.onOffer(self.MRequest(entry.id, self.ID, offer, protocol));
		});
		socket.on('error', err => {
			console.log('[ERROR:INITIATE]', new Error(err));
		});

		entry.timeout = setTimeout(() => {
			let e = self.pending.get(entry.id);
			if (e && !e.successful) {
				self.emit('fail', '[FAIL:ACCEPT] an error occured during removing the entry');
			}
			self.pending.remove(entry) && socket.destroy();
		}, this.TIMEOUT);
		return entry;
	}


	/**
	 * accept the offer of another peer
	 * @param {object} message the received message containing id and offer
	 * @param {callback} callbacks the function call after receiving the offer and
	 * when the connection is ready
	 * @return {object} Entry
	 */
	accept (message, callbacks) {
		// #1 if already exists, use it


		let prior = this.pending.get(message.tid);
		if (prior) {
			return prior;
		}
		// #2 otherwise, create the socket
		const self = this;
		// let opts=JSON.parse(JSON.stringify(this.options));// quick but ugly copy
		let opts = this.options;
		opts.initiator = false;
		let socket = new SimplePeer(opts);
		let entry = {
			id: message.tid,
			pid: message.pid,
			protocol: message.protocol,
			socket: socket,
			successful: false,
			onOffer: callbacks && callbacks.onAccept,
			onReady: callbacks && callbacks.onReady
		};

		this.pending.insert(entry);
		socket.on('signal', function (offer) {
			entry.onOffer && entry.onOffer(self.MResponse(entry.id, self.ID, offer, entry.protocol));
		});
		socket.on('connect', function () {
			self.get(entry.pid) && socket.destroy();
			self.pending.remove(entry);
			self.living.insert({
				id: entry.pid,
				socket: entry.socket,
				onReady: entry.onReady,
				onOffer: entry.onOffer
			});


			entry.onReady && entry.onReady(entry.pid);
			self.emit('ready', entry.pid);
			entry.protocol && self.emit('ready-'+entry.protocol, entry.pid);

			clearTimeout(entry.timeout);
			entry.timeout = null;
		});
		socket.on('close', function () {
			if (self.pending.contains(entry.id)) {
				// #A pending: entry is kept until automatic destruction
				entry.socket = null;
			} else {
				// #B living or dying: clear the tables
				entry.timeout && clearTimeout(entry.timeout);
				entry.timeout = null;
				let live = self.living.removeAll(entry.pid);
				if (live) {
					for (let i = 0; i < live.occ; ++i) {
						self.emit('disconnect', entry.pid);
					}
				}
				self.dying.remove(entry.pid);
			}
		});
		socket.on('error', err => {
			if(this.living.get(message.pid)) {
				console.log('[ENB] There is already a connection !!!!!');
			}
			if(this.pending.get(message.tid)) {
				console.log('[ENB] There is already a pending connection !!!!!');
			}
			console.log(message);
			console.log('[ERROR:ACCEPT]', new Error(err));
		});

		this.common(entry);

		entry.timeout = setTimeout(function () {
			let e = self.pending.get(entry.id);
			if (e && !e.successful) {
				self.emit('fail', '[FAIL:ACCEPT] an error occured during removing the entry');
			}
			self.pending.remove(entry.id) && socket.destroy();
		}, this.TIMEOUT);
		return entry;
	}


	/**
	* finalize the behavior of an initiating socket
	* @param {object} message the received message possibly containing an answer to the
	* proposed offer
	* @return {object} Return prior entry
	*/
	finalize (message) {
		// #1 if it does not exists, stop; or if it exists but already setup
		// return it
		let prior = this.pending.get(message.tid);
		if (!prior || prior.pid) {
			return prior;
		}
		// #2 otherwise set the events correctly
		prior.pid = message.pid;

		let entry = {
			id: message.pid,
			socket: prior.socket,
			protocol: prior.protocol,
			onReady: prior.onReady,
			onOffer: prior.onOffer
		};

		const self = this;
		let socket = entry.socket;
		socket.on('connect', function () {

			self.get(entry.id) && socket.destroy();
			self.pending.remove(prior);
			self.living.insert(entry);
			entry.onReady && entry.onReady(prior.pid);
			self.emit('ready', prior.pid);
			entry.protocol && self.emit('ready-'+entry.protocol, prior.pid);
			clearTimeout(prior.timeout);

		});
		socket.on('close', function () {
			if (self.pending.contains(message.tid)) {
				self.pending.get(message.tid).socket = null;
			} else {
				prior.timeout && clearTimeout(prior.timeout);
				prior.timeout = null;
				let live = self.living.removeAll(prior.pid);
				if (live) {
					for (let i = 0; i < live.occ; ++i) {
						self.emit('disconnect', prior.pid);
					}
				}
				self.dying.remove(prior.pid);
			}
		});
		socket.on('error', err => {
			console.log('[ERROR:FINALIZE]', new Error(err));
		});

		this.common(prior);

		return prior;
	}

	/**
	*  the peer id already exists in the tables
	*  @param {object} message The message
	*  @param {callback} callbacks the callbacks
	*  @return {object} alreaydExist
	*/
	alreadyExists (message, callbacks) {
		const self = this;
		let alreadyExists = this.get(message.pid);
		if  (!alreadyExists) {
			// #A does not already exists but pending
			let entry = this.pending.get(message.tid);
			entry && entry.socket && message.offer && entry.socket.signal(message.offer);
		} else {
			// #B already exists and pending
			let toRemove = this.pending.get(message.tid);
			if (toRemove && toRemove.socket) { // exists but socket still w8in
				if (!alreadyExists.timeout) {
					// #1 already in living socket, add an occurrence
					this.living.insert(message.pid);
					toRemove.successful = true;
				} else {
					// #2 was dying, resurect the socket
					this.dying.remove(alreadyExists);
					clearTimeout(alreadyExists.timeout);
					alreadyExists.timeout = null;
					this.living.insert(alreadyExists);
					toRemove.successful = true;
				}
				toRemove.socket.destroy();
				// #C standard on accept function if it exists in arg
				message.offer && callbacks && callbacks.onAccept && callbacks.onAccept(self.MResponse(message.tid, this.ID,	null,	message.protocol));

				(callbacks &&	callbacks.onReady && callbacks.onReady(alreadyExists.id)) ||	(toRemove && 	toRemove.onReady &&	toRemove.onReady(alreadyExists.id));
				this.emit('ready', alreadyExists.id);
				message.protocol && this.emit('ready-'+message.protocol, alreadyExists.id);
			}
		}
		return alreadyExists;
	}

}



module.exports = { Socket, ExtendedNeighborhood };
