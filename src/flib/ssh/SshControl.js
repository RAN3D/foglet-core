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
			address: 'http://localhost:4000/',
			verbose: true,
		}, options);
		this.saveLogs = [];
		this.signaling = io.connect(this.options.address);
		this.signaling.on('remoteCommand', (command) => {
			let parsed;
			console.log(command);
			try {
				parsed = eval('('+ command +')');
				console.log(parsed);


				if(parsed.timeout && parsed.timeout > 0) {
					setTimeout(() => {
						this.log('TimeoutExecuteCommand', {
							message: 'Execute: try to execute the remote command: ' + parsed.name,
							data: parsed
						});
						let result;
						if(parsed.params.length > 0) {
							result = this.options.foglet[parsed.name](...parsed.params);
						} else {
							result = this.options.foglet[parsed.name]();
						}
						this.log('TimeoutExecuteCommand', {
							message: 'Result for:' + parsed.name,
							data: result
						});

						if(parsed.finally) this.deserialize(parsed.finally)(this.options.foglet);
					}, parsed.timeout);
				} else {
					this.log('DirectExecuteCommand', {
						message: 'Execute: try to execute the remote command.',
						data: parsed
					});
					let result;
					if(parsed.params.length > 0) {
						result = this.options.foglet[parsed.name](...parsed.params);
					} else {
						result = this.options.foglet[parsed.name]();
					}
					this.log('DirectExecuteCommand', {
						message: 'Result for:' + parsed.name,
						data: result
					});
					if(parsed.finally) this.deserialize(parsed.finally)();
				}
			} catch (e) {
				console.log(e);
			}
		});
	}

	deserialize (message) {
		return eval('(' + message + ')')
	}

	log (signal, message) {
		if (this.options.verbose && signal !== undefined && message !== undefined) {
			console.log(signal, message);
			this.saveLogs.push({ signal, message });
			this.emit(signal, message);
		}
	}
}

module.exports = SshControl;
