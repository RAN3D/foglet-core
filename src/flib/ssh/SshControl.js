'use strict';

const EventEmitter = require ('events');
const _ = require('lodash');
const io = require('socket.io-client');
const uuid = require('uuid/v4');


class SshControl extends EventEmitter {
	constructor (options = {}) {
		super();
		this.options = _.merge({
			foglet: undefined,
			signalingAddress: 'http://localhost:4000/',
			verbose: true,
			room: 'default-room'
		}, options);
		this.saveLogs = [];
		this.id = uuid();
		this.signaling = io.connect(this.options.signalingAddress);
		const self = this;
		this.signaling.on('remoteCommand', (command) => {
			let parsed;
			try {
				parsed = eval('('+ command +')');
				console.log('executeCommand', `Execute: try to execute the remote command (id:${id})`, parsed);
				if(parsed.params.length > 0) {
					this.options.foglet[parsed.name](...parsed.params);
				} else {
					this.options.foglet[parsed.name]();
				}

			} catch (e) {
				console.log(e);
			}
		});
	}


	log (signal, message) {
		if (this.options.verbose && signal !== undefined && message !== undefined) {
			this.saveLogs.push({ signal, message });
			this.emit(signal, message);
		}
	}
}

module.exports = SshControl;
