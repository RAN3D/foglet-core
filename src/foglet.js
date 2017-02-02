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

const EventEmitter = require('events').EventEmitter;
const VVwE = require('version-vector-with-exceptions');
const CausalBroadcast = require('causal-broadcast-definition');
const Unicast = require('unicast-definition');
const io = require('socket.io-client');
const Q = require('q');

const FRegister = require('./fregister.js').FRegister;
const ConstructException = require('./fexceptions.js').ConstructException;
const InitConstructException = require('./fexceptions.js').InitConstructException;
const FRegisterAddException = require('./fexceptions.js').FRegisterAddException;
const GUID = require('./guid.js');

const uid = new GUID();
let SIGNALINGHOSTURL = 'http://localhost:3000/';
if (process.env.HOST) {
	SIGNALINGHOSTURL = process.env.HOST;
}

/**
 * Create a Foglet Class in order to use Spray with ease
 * @class Foglet
 * @author Grall Arnaud (folkvir)
 */
class Foglet extends EventEmitter {
	/**
	 * Constructor of Foglet
	 * @constructs Foglet
	 * @param {object} options - it's an object representing options avalaible
	 * @throws {InitConstructException} If options is undefined
	 * @throws {ConstructException} spray, protocol and room must be defined.
	 * @example
	 * var f = new Foglet({
	 * 	spray: new Spray()
	 * 	room: "your-room-name"
	 * })
	 * @returns {void}
	 */
	constructor (options) {
		super();
		if (options === undefined) {
			throw (new InitConstructException());
		}
		this.options = options;
		this.statusList = [ 'initialized', 'error', 'connected', 'disconnected' ];
		this.status = this.statusList[0];
		// Activation of the foglet protocol
		if (this.options.spray !== undefined && this.options.spray !== null && this.options.spray.protocol !== undefined && this.options.spray.protocol !== null && this.options.room !== undefined && this.options.room !== null) {
			this.room = this.options.room;
			this.protocol = this.options.spray.protocol;
			this.spray = this.options.spray;
			this.status = this.statusList[0];
			this.signalingServer = this.options.signalingServer || SIGNALINGHOSTURL;
			// This id is NOT the SAME as the id in the spray protocol, it is tempory, id will be replaced by spray id
			this.id = uid.guid();
			this._flog('Constructed');
		} else {
			this.status = this.statusList[1];
			throw (new ConstructException());
		}
	}

	/**
	 * Initialization method for Foglet
	 * @function init
	 * @returns {void}
	 */
	init () {
		const self = this;
		this.vector = new VVwE(Number.MAX_VALUE);
		this.broadcast = new CausalBroadcast(this.spray, this.vector);
		this.unicast = new Unicast(this.spray, this.protocol + '-unicast');
		//	SIGNALING PART
		// 	THERE IS AN AVAILABLE SERVER ON ?server=http://signaling.herokuapp.com:4000/
		let url = this._getParameterByName('server');
		if (url === null) {
			url = this.signalingServer;
		}
		this._flog('Signaling server used : ' + url);
		//	Connection to the signaling server
		this.signaling = io.connect(url);
		//	Connection to a specific room
		self.signaling.emit('joinRoom', self.room);

		this.callbacks = () => {
			return {
				onInitiate: offer => {
					self.signaling.emit('new', {offer, room: self.room});
				},
				onAccept: offer => {
					self.signaling.emit('accept', {
						offer,
						room: self.room
					});
				},
				onReady: (id) => {
					try {
						self.status = self.statusList[2];
						self._flog('Connection established');
						//self.emitJoin(id);
					} catch (err) {
						console.log(err);
					}
				}
			};
		};

		this.signaling.on('new_spray', (data) => {
			self.spray.connection(self.callbacks(), data);
		});
		this.signaling.on('accept_spray', (data) => {
			self.spray.connection(self.callbacks(), data);
		});

		this.registerList = {};
		this._flog('Initialized');
	}

	/**
	 * Connection method for Foglet to the network specified by protocol and room options
	 * @function connection
	 * @return {Promise} Return a Q.Promise
	 * @example
	 * var f = new Foglet({...});
	 * f.connection().then((response) => console.log).catch(error => console.err);
	 */
	connection () {
		if (this.spray === null) {
			this._flog(' Error : spray undefined.');
			return null;
		}
		const self = this;
		return Q.Promise(function (resolve, reject) {
			try {
				self.spray.connection(self.callbacks());
				self.spray.on('join', () => {
					// We are waiting for 2 seconds for a proper connection
					setTimeout(function () {
						self._flog('Status : '+self.status);
						if(self.status !== 'connected') {
							self.spray.connection(self.callbacks());
						}else{
							resolve(self.status);
						}
					}, 1000);
				});

			} catch (error) {
				reject(error);
			}
		});
	}

	/**
	 * Disconnect the foglet, wait 2 seconds for a proper disconnection, if status !=== disconnected, we re-load the function
	 * @return {promise} Return a promise with the status as
	 */
	// disconnect() {
	// 	if (this.spray === null) {
	// 		this._flog(' Error : spray undefined.');
	// 		return null;
	// 	}
	// 	const self = this;
	// 	return Q.Promise(function(resolve, reject) {
	// 		try {
	// 			console.log("we are trying to disconnect the user...1");
	// 			self.spray.leave();
	// 			console.log("we are trying to disconnect the user...2");
	// 			self.status = self.statusList[3];
	// 			console.log("we are trying to disconnect the user...3");
	// 			self.signaling.emit('disconnect', self.room, self.socketId);
	// 			//We are waiting for 2 seconds for a proper disconnection
	// 			setTimeout(function(){
	// 				if(self.spray.getPeers().i.length === 0){
	// 					self.status = self.statusList[3];
	// 					self._flog('Status : '+self.status);
	// 					console.log("we are trying to disconnect the user...4");
	// 					resolve(self.status);
	// 				}else{
	// 					console.log("we are trying to disconnect the user...5");
	// 					self.disconnect();
	// 				}
	// 			}, 2000);
	// 		} catch (error) {
	// 			console.log("we are trying to disconnect the user...6" );
	// 			reject(error);
	// 		}
	// 	});
	// }

	/**
	 * Add a register to the foglet, it will broadcast new values to connected clients.
	 * @function addRegister
	 * @param {String} name - Name of the register
	 * @throws {FRegisterAddException} Throw an exception is not defined or different of the null string
	 * @returns {void}
	 */
	addRegister (name) {
		if (name !== undefined && name !== '') {
			const spray = this.spray;
			const vector = new VVwE(Number.MAX_VALUE);
			const broadcast = new CausalBroadcast(spray, vector, name, 1000);
			const options = {
				name,
				spray,
				vector,
				broadcast
			};
			const reg = new FRegister(options);
			this.registerList[this._fRegisterKey(reg)] = reg;
		} else {
			throw (new FRegisterAddException());
		}
	}

	/**
	 * Return a register by its name
	 * @function getRegister
	 * @param {String} name - Name of the register
	 * @returns {void}
	 */
	getRegister (name) {
		return this.registerList[name];
	}


	/**
	 * This callback is a parameter of the onRegister function.
	 * @callback callback
	 * @param {object} responseData - Data emits on update
	 */
	/**
	 * Allow to listen emits on a register when updated with a specified name and callback
	 * @function onRegister
	 * @param {String} name - Name of the register
	 * @param {callback} callback - Callback function that handles the response
	 * @returns {void}
	 */
	onRegister (name, callback) {
		this.getRegister(name).on(name + '-receive', callback);
	}

	/**
	 * Allow to listen on Foglet when a broadcasted message arrived
	 * @function onBroadcast
	 * @param {string} signal - The signal we will listen to.
	 * @param {callback} callback - Callback function that handles the response
	 * @returns {void}
	**/
	onBroadcast (signal, callback) {
		this.broadcast.on(signal, callback);
	}


	/**
	 * Send a broadcast message to all connected clients.
	 * @function sendBroadcast
	 * @param {object} msg - Message to send.
	 * @returns {void}
	 */
	sendBroadcast (msg) {
		if ((this.broadcast !== null) && (this.vector !== null)) {
			this.broadcast.send(msg, this.vector.increment());
			this._flog(' message sent : ' + msg);
		} else {
			this._flog('Error : broadcast or vector undefined.');
		}
	}

	/**
	 * This callback is a parameter of the onUnicast function.
	 * @callback callback
	 * @param {string} id - sender id
	 * @param {object} message - the message received
	 */
	/**
	 * onUnicast function allow you to listen on the Unicast Definition protocol, Use only when you want to receive a message from a neighbour
	 * @function onUnicast
	 * @param {callback} callback The callback for the listener
	 * @return {void}
	 */
	onUnicast (callback) {
		this.unicast.on('receive', callback);
	}

	/**
	 * Send a message to a specific neighbour (id)
	 * @function sendUnicast
	 * @param {object} message - The message to send
	 * @param {string} id - One of your neighbour's id
	 * @return {boolean} return true if it seems to have sent the message, false otherwise.
	 */
	sendUnicast (message, id) {
		return this.unicast.send(message, id);
	}

	/**
	 * Get a random id of my current neighbours
	 * @function getRandomPeerId
	 * @return {string} return an id or a null string otherwise
	 */
	getRandomNeighbourId () {
		const peers = this.getNeighbours();
		if(peers.length === 0) {
			return '';
		} else {
			try {
				const random = Math.floor(Math.random() * peers.length);
				const result = peers[random];
				console.log(result);
				return result;
			} catch (e) {
				console.err(e);
				return '';
			}
		}
	}

	/**
	 * Get a full list of all available neighbours
	 * @function getNeighbours
	 * @return {array}  Array of string representing neighbours id, if no neighbours, return an empty array
	 */
	getNeighbours () {
		const peers = this.spray.getPeers();
		if(peers.i.length === 0) {
			return [];
		} else {
			return peers.i;
		}
	}

	/**
	 * Return the name of a Register
	 * @function _fRegisterKey
	 * @private
	 * @param {Register} obj - Register to return the name
	 * @return {string} name - Name of the register in parameter
	 */
	_fRegisterKey (obj) {
		return obj.name;
	}

	/**
	 * Return url parameters from an url and a name, if no url we use the url browser.
	 * @function _getParameterByName
	 * @private
	 * @param {string} name - Name of the parameter
	 * @param {string} url - Url we want go parse
	 * @returns {array} Return the value of the specified url or of the url provided by window.location.href
	 */
	_getParameterByName (name, url) {
		if (!url) {
			url = window.location.href;
		}
		name = name.replace(/[\[\]]/g, '\\$&');
		const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
		const results = regex.exec(url);
		if (!results) {
			return null;
		}
		if (!results[2]) {
			return '';
		}
		return decodeURIComponent(results[2].replace(/\+/g, ' '));
	}

	/**
	 * Log by prefixing the message;
	 * @function _flog
	 * @private
	 * @param {string} msg Message to log
	 * @returns {void}
	 */
	_flog (msg) {
		console.log('[FOGLET]:' + ' @' + this.id + ': ' + msg);
	}
}

module.exports = Foglet;
