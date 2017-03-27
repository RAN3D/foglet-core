'use strict';

const _ = require('lodash');
const Fcn = require('fcn-wrtc').Fcn;
const Q = require('q');

const AbstractAdapter = require('./AbstractAdapter.js');
const FBroadcast = require('../fbroadcast.js');
const Unicast = require('unicast-definition');

class fcnAdapter extends AbstractAdapter {
	constructor (options) {
		super();
		this.options = _.merge({

		}, options);

		this.rps = new Fcn(this.options);
		this.options.rps = this.rps;

		this.inviewId = this.rps.socket.i.ID;
		this.outiewId = this.rps.socket.o.ID;

		// COMMUNICATION
		this.unicast = new Unicast(this.rps, this.options.protocol + '-unicast');
		this.broadcast = new FBroadcast({
			foglet: this,
			protocol: this.options.protocol
		});
	}

	connection (rps, timeout) {
		return Q(this.rps.connection(rps.rps, timeout));
	}

	getNeighbours () {
		return this.rps.getNeighbours();
	}

	getPeers () {
		return this.rps.getPeers();
	}

	send (id, message) {
		return this.rps.send(id, message);
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

	exchange () {
		// nothing to do
	}
}

module.exports = fcnAdapter;
