'use strict';
const serialize = require('serialize-javascript');
let express = require('express');
let http = require('http');
let io = require('socket.io');
let ioClient = require('socket.io-client');
const fs = require('fs');
const _ = require('lodash');
const uuid = require('uuid/v4');
console.log(process.argv);
if(process.argv.length === 4) {
	if(process.argv[2] === 'runServer') {
		console.log('Dirname: ' + __dirname);
		console.log('Config location: '+ process.argv[3]);
		fs.readFile(process.argv[3], 'utf8', (err, data) => {
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
	} else if(process.argv[2] === 'sendCommands') {
		try {
			sendCommands(process.argv[3]);
		} catch (e) {
			console.log(e);
		}
	}
}

function sendCommands (configFileLocation) {
	console.log('Dirname: ' + __dirname);
	console.log('Config location: '+ process.argv[3]);
	fs.readFile( process.argv[3], 'utf8', (err, data) => {
		if (err) throw err;
		let parsed;
		console.log(data);
		try {
			parsed = JSON.parse(data);
		} catch (e) {
			console.log(e);
		}
		const signaling = ioClient(parsed.sshAddress);
		console.log('SSH Server adress: ' + parsed.sshAddress);
		if(parsed.commands.length > 0) {
			parsed.commands.forEach( obj => {
				console.log(obj);
				signaling.emit('remoteOrder', serialize({
					id: uuid(),
					before: function () {
						setTimeout( function () {
							console.log('Remote connection wait '+ obj.timeout + ' ms');
						}, obj.timeout);
					},
					name: obj.command,
					params: obj.args,
					after: function () {
						console.log('Remote connection. ');
					}
				}));
			});
			console.log('finished');
		} // end if commands
	}); // end readfile
} // end sendCommands
