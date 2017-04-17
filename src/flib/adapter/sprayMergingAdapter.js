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
		// this.rps.register('1');
		// this.peer = this.rps.register(this.options.protocol);

		this.inviewId = this.rps.getInviewId();
		this.outviewId = this.rps.getOutviewId();
		this.id = this.inviewId+'_'+this.outviewId;

		this.broadcast = new FBroadcast({
			rps: this,
			protocol: this.options.protocol
		});
		log(this.unicast, this.broadcast);
		//	Connection to the signaling server
		this.signaling = io.connect(this.options.signalingAdress, {origins: options.origins});

		this.signalingInit = () => {
			return (offer) => {
				log(`@${this.inviewId}: Emit the new offer: `, offer);
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
				log(`@${this.inviewId}: Emit the accepted offer: `, offer);
				this.signaling.emit('accept', { offer, room: this.options.room });
			};
			log(`@${this.inviewId}: Receive a new offer: `, data);
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
		this.broadcast.on('receive', callback);
	}


	/**
	 * Send a broadcast message to all connected clients.
	 * @function sendBroadcast
	 * @param {object} msg - Message to send,
	 * @param {string} id - Id of the message to send (see VVwE: github.com/chat-wane/version-vector-with-exceptions).
	 * @returns {void}
	 */
	sendBroadcast (msg, id) {
		this.broadcast.send(msg, id);
	}

	send (protocol, id, message) {
		if(protocol && message && id) {
			log('Send a message to one client: ', protocol, id, message);
			this.rps.emit(protocol, id, message);
		} else if(protocol && message && !id) {
			const neighbours = this.getNeighbours();
			log('Send a message to multiple clients: ', protocol, neighbours, message);
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
