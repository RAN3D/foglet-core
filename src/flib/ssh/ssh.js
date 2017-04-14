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
		this.signaling = io.connect(this.options.address, {origins: '*:*'});
		this.signaling.emit('join', {
			id: this.options.foglet.id
		});

		this.signaling.on('remoteCommand', (command) => {
			let parsed;
			this.log('remoteCommand', command);
			try {
				parsed = eval('('+ command +')');
				this.log(parsed);
				this.deserialize(parsed.command)(this.options.foglet);
			} catch (e) {
				this.log(e);
			}
		});
	}

	deserialize (message) {
		return eval('(' + message + ')');
	}

	log (signal, message) {
		if (this.options.verbose && signal !== undefined && message !== undefined) {
			this.emit('logs', signal, message);
		}
	}
}

module.exports = SshControl;
