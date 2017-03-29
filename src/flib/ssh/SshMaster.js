'use strict';
const serialize = require('serialize-javascript');
const ioClient = require('socket.io-client');
const fs = require('fs');
const _ = require('lodash');
const uuid = require('uuid/v4');


if(process.argv.length === 4) {
	const args = process.argv[3];
	if(process.argv[2] === 'runServer') {
		runServer(args);
	} else if(process.argv[2] === 'sendCommands') {
		sendCommands(args);
	}
}

function runServer (options){
	console.log('Dirname: ' + __dirname);
	console.log('Config location: '+ options);
	fs.readFile(options, 'utf8', (err, data) => {
		if (err) throw err;
		let parsed;
		console.log(data);
		try {
			parsed = JSON.parse(data);
		} catch (e) {
			console.log(e);
		}
		let options = _.merge({
			port: 4000,
			room: 'default-ssh-room'
		}, parsed);
		const S = require('./server.js').init(options);
	});
}

function sendCommands (configFileLocation) {
	console.log('Dirname: ' + __dirname);
	console.log('Config location: '+ configFileLocation);
	fs.readFile( configFileLocation, 'utf8', (err, data) => {
		if (err) throw err;
		let parsed;
		console.log(data);
		try {
			parsed = JSON.parse( data );
			const signaling = ioClient(parsed.sshAddress);
			console.log('SSH Server adress: ' + parsed.sshAddress);
			if(parsed.commands.length > 0) {
				parsed.commands.forEach( obj => {
					if(obj.timeout) {
						setTimeout(() => {
							const sent = serialize({
								command: obj.command,
								timeout: obj.timeoutBeforeEach
							});
							console.log(sent);
							signaling.emit('remoteOrder', sent);
						}, obj.timeout);
					} else {
						const sent = serialize({
							command: obj.command,
							timeout: obj.timeoutBeforeEach
						});
						console.log(sent);
						signaling.emit('remoteOrder', sent);
					}
				});
				console.log('finished');
			}
		} catch (e) {
			console.log(e);
		}
	}); // end readfile
} // end sendCommands
