'use strict';

const EventEmitter = require ('events');
const _ = require('lodash');
const io = require('socket.io-client');

class SshControl extends EventEmitter {
	constructor (options = {}) {
		super();
		this.options = _.merge({
			foglet: undefined,
			address: 'http://localhost:4000/',
			verbose: true,
		}, options);
		this.signaling = io.connect(this.options.address);
		this.signaling.emit('join', {
			id: this.options.foglet.id
		});

		this.signaling.on('remoteCommand', (command) => {
			let parsed;
			console.log(command);
			try {
				parsed = eval('('+ command +')');
				console.log(parsed);
				this.deserialize(parsed.command)(this.options.foglet);
			} catch (e) {
				console.log(e);
			}
		});
	}

	deserialize (message) {
		return eval('(' + message + ')');
	}

	log (signal, message) {
		if (this.options.verbose && signal !== undefined && message !== undefined) {
			console.log(signal, message);
			this.emit('logs', signal, message);
		}
	}
}

module.exports = SshControl;
