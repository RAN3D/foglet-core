'use strict';
const _ = require('lodash');
const Spray = require('spray-wrtc');
const io = require('socket.io-client');
const Q = require('q');
const AbstractAdapter = require('./AbstractAdapter.js');
const FBroadcast = require('../fbroadcast.js');
const log = require('debug')('foglet-core:spray-wrtc-merge');

class SprayAdapter extends AbstractAdapter {
	constructor (options) {
		super();
		log('Merging version of spray, pending construct...');
		this.options = _.merge({
			origins:'*'
		}, options);

		this.rps = new Spray(this.options);

		// this.peer = this.rps.register(this.options.protocol);

		this.inviewId = this.rps.getInviewId();
		this.outviewId = this.rps.getOutviewId();
		this.id = this.inviewId+'_'+this.outviewId;

		this.broadcast = new FBroadcast({
			rps: this,
			protocol: this.options.protocol
		});

		//	Connection to the signaling server
		this.signaling = io.connect(this.options.signalingAdress, {origins: options.origins});
		this.sign = new Map();

		this.signalingInit = () => {
			return (offer) => {
				log(`@${this.id}: Emit the new offer: `, offer);
				this.signaling.emit('new', {offer, room: this.options.room});
			};
		};

		this.directCallback = (src, dest) => {
			return (offer) => {
				dest.connect( (answer) => {
					src.connect(answer);
				}, offer);
			};
		};

		this.signaling.on('new_spray', (data) => {
			const signalingAccept = (offer) => {
				log(`@${this.id}: Emit the accepted offer: `, offer);
				this.signaling.emit('accept', { offer, room: this.options.room });
			};
			log(`@${this.id}: Receive a new offer: `, data);
			this.rps.connect(signalingAccept, data);
		});
		this.signaling.on('accept_spray', (data) => {
			log('Receive an accepted offer: ', data);
			this.rps.connect(data);
		});

	}

	connection (rps, timeout) {
		log('Pending connection...');
		const self = this;
		return Q.Promise(function (resolve, reject) {
			try {
				if(rps) {
					self.rps.join(self.directCallback(self.rps, rps.rps)).then(() => {
						self.emit('connected', { room: self.options.room });
					}).catch(error => {
						log(error);
						if(error === 'connected') {
							resolve(true);
						} else {
							reject(error);
						}
					});
				} else {
					self.signaling.emit('joinRoom', { room: self.options.room });
					self.signaling.once('joinedRoom', () => {
						log(' Joined the room', self.options.room);
						self.rps.join(self.signalingInit()).then(() => {
							self.emit('connected', { room: self.options.room });
						}).catch(error => {
							log(error);
							if(error === 'connected') {
								resolve(true);
							} else {
								reject(error);
							}
						});
					});
				}
				self.once('connected', () => {
					log(`@${self.id} is now connected`);
					resolve(true);
				});
				setTimeout(() => {
					reject();
				}, timeout);
			} catch (error) {
				reject(error);
			}
		});
	}

	/**
	 * Allow to listen on Foglet when a broadcasted message arrived
	 * @function onBroadcast
	 * @param {callback} callback - Callback function that handles the response
	 * @returns {void}
	**/
	onBroadcast (callback) {
		this.broadcast.on(this.protocol+'-receive', callback);
	}


	/**
	 * Send a broadcast message to all connected clients.
	 * @function sendBroadcast
	 * @param {object} msg - Message to send,
	 * @param {string} id - Message to send.
	 * @returns {void}
	 */
	sendBroadcast (msg, id) {
		this.broadcast.send(msg, id);
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
		this.receive(this.options.protocol, callback);
	}

	/**
	 * Send a message to a specific neighbour (id)
	 * @function sendUnicast
	 * @param {object} message - The message to send
	 * @param {string} id - One of your neighbour's id
	 * @return {boolean} return true if it seems to have sent the message, false otherwise.
	 */
	sendUnicast (message, id) {
		this.send(this.options.protocol, id, message);
	}

	send (protocol, id, message) {
		log('Send a message: ', protocol, id, message);
		if(message && id) {
			this.rps.emit(this.options.protocol, id, message);
		} else if(message && !id) {
			const neighbours = this.getNeighbours();
			this.rps.emit(protocol, neighbours, message);
		}
	}

	receive (protocol, callback) {
		this.rps.on(protocol, callback);
	}

	getNeighbours (k = undefined) {
		return this.getPeers(k);
	}

	getPeers () {
		return this.rps.getPeers();
	}

	exchange () {
		this.rps.exchange();
	}
}

module.exports = SprayAdapter;
