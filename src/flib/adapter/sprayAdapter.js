'use strict';
const EventEmitter = require ('events');
const _ = require('lodash');
const Spray = require('spray-wrtc');
const io = require('socket.io-client');
const Q = require('q');

class sprayAdapter extends EventEmitter {
	constructor (options) {
		super();
		this.options = _.merge({

		}, options);

		this.rps = new Spray(this.options);
		this.inviewId = this.rps.profile.inviewId;
		this.outviewId = this.rps.profile.outviewId;

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

	getNeighbours () {
		let res = [];
		let peers = this.getPeers().o;
		if(peers.o.length > 0) peers.forEach(p => res.push(p));
		return res;
	}

	getPeers () {
		return this.rps.getPeers();
	}
}

module.exports = sprayAdapter;
