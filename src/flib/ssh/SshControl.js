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
			id: 'default-client-id',
			verbose: true,
			room: 'default-room'
		}, options);
		console.log(this.options);
		this.saveLogs = [];
		this.id = this.options.id + '_' + uuid();
		this.signaling = io.connect(this.options.signalingAddress);
		this.signaling.emit('join', {
			room: this.options.room,
			id: this.id,
		});

		this.signaling.on('remoteCommand', (command) => {
			if(command && command.id && command.before && command.after && command.name && command.params) {
				this.execute(command);
			} else {
				this.log('remoteOrder', 'Error: need message.id && message.command (function)');
			}
		});
	}

	execute (command) {
		const id = command.id;
		const commandName = command.name;
		const params = command.params;
		try {
			this.log('executeCommand', `Execute: try to execute the remote command (id:${id})`);
			this.options.foglet[commandName](params);
		} catch (e) {
			this.log('executeCommand', 'Error:' + e.toString());
		}
	}

	log (signal, message) {
		if (this.options.verbose && signal !== undefined && message !== undefined) {
			this.saveLogs.push({ signal, message });
			this.emit(signal, message);
		}
	}
}

module.exports = SshControl;
