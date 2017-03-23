'use strict';
const EventEmitter = require ('events');
const _ = require('lodash');
const Fcn = require('fcn-wrtc').Fcn;
const Q = require('q');

class fcnAdapter extends EventEmitter {
	constructor (options) {
		super();
		this.options = _.merge({

		}, options);

		this.rps = new Fcn(this.options);
		this.inviewId = this.rps.socket.i.ID;
		this.outiewId = this.rps.socket.o.ID;
	}

	connection (rps = undefined, timeout = 60000) {
		return Q(this.rps.connection(rps, timeout));
	}

	getNeighbours () {
		return this.rps.getNeighbours();
	}

	getPeers () {
		return this.rps.getPeers();
	}

	send (id, message) {
		this.rps.send(id, message);
	}

	exchange () {
		// nothing to do
	}
}

module.exports = fcnAdapter;
