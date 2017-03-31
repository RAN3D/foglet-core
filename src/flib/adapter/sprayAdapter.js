'use strict';
const _ = require('lodash');
const Spray = require('spray-wrtc');
const io = require('socket.io-client');
const Q = require('q');
const AbstractAdapter = require('./AbstractAdapter.js');
const FBroadcast = require('../fbroadcast.js');
const Unicast = require('unicast-definition');

class sprayAdapter extends AbstractAdapter {
	constructor (options) {
		super();
		this.options = _.merge({

		}, options);

		this.rps = new Spray(this.options);
		this.options.rps = this.rps;
		
		this.inviewId = this.rps.profile.inviewId;
		this.outviewId = this.rps.profile.outviewId;
		// COMMUNICATION
		this.unicast = new Unicast(this.rps, this.options.protocol + '-unicast');
		this.broadcast = new FBroadcast({
			foglet: this,
			protocol: this.options.protocol
		});
		//	Connection to the signaling server
		this.signaling = io.connect(this.options.signalingAdress);

		this.signalingCallback = () => {
			return {
				onInitiate: offer => {
					this.rps.log('Emit the new offer:', offer);
					this.signaling.emit('new', {offer, room: this.options.room});
				},
				onAccept: offer => {
					this.rps.log('Emit the accpeted offer:', offer);
					this.signaling.emit('accept', { offer, room: this.options.room });
				},
				onReady: (id) => {
					this.signaling.emit('connected',  { room: this.options.room });
					this.rps.log('Connected to the peer :', id);
				}
			};
		};

		this.directCallback = (src, dest) => {
			return {
				onInitiate: (offer) => {
					dest.connection(this.directCallback(dest, src), offer);
				},
				onAccept: offer => {
					dest.connection(offer);
				},
				onReady: (id) => {
					this.emit('connected', { room: this.options.room });
					this.rps.log('Connected to the peer :', id);
				}
			};
		};

		this.signaling.on('new_spray', (data) => {
			this.rps.log('Receive a new offer:', data);
			this.rps.connection(this.signalingCallback(), data);
		});
		this.signaling.on('accept_spray', (data) => {
			this.rps.log('Receive an accepted offer:', data);
			this.rps.connection(data);
		});
	}

	connection (rps, timeout) {
		const self = this;
		return Q.Promise(function (resolve, reject) {
			try {
				if(rps) {
					self.rps.connection(self.directCallback(self.rps, rps.rps));
					self.once('connected', () => {
						resolve(true);
					});
				} else {
					self.signaling.emit('joinRoom', { room: self.options.room });
					self.signaling.once('joinedRoom', () => {
						self.rps.log(' Joined the room', self.options.room);
						self.rps.connection(self.signalingCallback());
					});
					self.signaling.once('connected', () => {
						resolve(true);
					});
				}


				setTimeout(() => {
					reject();
				}, timeout);
			} catch (error) {
				reject(error);
			}
		});
	}

	send (id, message, retry = 10) {
		return this.rps.send(id, message, retry);
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
		this.broadcast.send(msg);
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

	getNeighbours () {
		let res = [];
		let peers = this.getPeers().o;
		if(peers.o.length > 0) peers.forEach(p => res.push(p));
		return res;
	}

	getPeers () {
		return this.rps.getPeers();
	}

	exchange () {
		this.rps.exchange();
	}
}

module.exports = sprayAdapter;
