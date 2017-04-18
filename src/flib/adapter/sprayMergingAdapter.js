'use strict';
const _ = require('lodash');
const Spray = require('spray-wrtc');
const io = require('socket.io-client');
const Q = require('q');
const AbstractAdapter = require('./AbstractAdapter.js');
const Unicast = require('unicast-definition');
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
		this.inviewId = this.rps.getInviewId();
		this.outviewId = this.rps.getOutviewId();
		this.id = this.inviewId+'_'+this.outviewId;

		// Unicast protocol to send message to remote peers
		this.unicast = new Unicast(this.rps, {});
		this.peer = this.unicast.register(this.options.protocol);

		// Broadcast protocol so send message to the whole network
		this.broadcast = new FBroadcast({
			rps: this,
			protocol: this.options.protocol
		});
		log(this.unicast, this.broadcast);
		//	Connection to the signaling server
		this.signaling = io.connect(this.options.signalingAdress, {origins: options.origins});


		this.directCallback = (src, dest) => {
			return (offer) => {
				dest.connect( (answer) => {
					src.connect(answer);
				}, offer);
			};
		};

		this.signalingInit = () => {
			return (offer) => {
				log(`@${this.inviewId}: Emit the new offer: `, offer);
				this.signaling.emit('new', {offer, room: this.options.room});
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
		this.peer.on(this.options.protocol, callback);
	}

	/**
	 * Send a message to a specific neighbour (id)
	 * @function sendUnicast
	 * @param {object} message - The message to send
	 * @param {string} id - One of your neighbour's id
	 * @return {boolean} return true if it seems to have sent the message, false otherwise.
	 */
	sendUnicast (message, id) {
		return this.peer.emit(this.options.protocol, id, this.outviewId, message);
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
