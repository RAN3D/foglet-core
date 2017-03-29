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

				if(parsed.promise) {
					if(parsed.timeout && parsed.timeout >= 0) {
						setTimeout(() => {
							this.log('TimeoutExecuteCommand', {
								message: 'Promise: try to execute the remote promise: ' + parsed.name,
								data: parsed
							});
							let result;
							if(parsed.params.length > 0) {
								console.log(parsed.promise);
								result = this.options.foglet[parsed.name](...parsed.params).then((data) => {
									this.deserialize(parsed.promise)(data, this.options.foglet);
									this.log('TimeoutExecuteCommand', {
										message: 'Result for:' + parsed.name,
										data: result
									});
								});
							} else {
								result = this.options.foglet[parsed.name]().then((data) => {
									this.deserialize(parsed.promise)(data, this.options.foglet);
									this.log('TimeoutExecuteCommand', {
										message: 'Result for:' + parsed.name,
										data: result
									});
								});
							}


							if(parsed.finally) this.deserialize(parsed.finally)(this.options.foglet);
						}, parsed.timeout);
					}
				} else {
					if(parsed.timeout && parsed.timeout >= 0) {
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
					}
				}
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
