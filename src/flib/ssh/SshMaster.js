'use strict';

let express = require('express');
let http = require('http');
let io = require('socket.io');
const fs = require('fs');
const _ = require('lodash');
const uuid = require('uuid/v4');

if(process.argv.length >= 4) {
	if(process.argv[2] === 'runServer') {
		const S = require('./server.js').init(process.argv[3]);
	}
}

// if(process.argv.length >= 4) {
// 	const commandName = process.argv[2];
// 	switch(commandName) {
// 	case 'runServer':
// 		const args = process.argv[3];
// 		if(args && args.port) {
//
// 		}
// 		break;
//
// 	// case 'sendCommands':
// 	// 	try{
// 	// 		sendCommands(process.argv[3]);
// 	// 	} catch (e) {
// 	// 		console.log(e);
// 	// 	}
// 	// 	break;
// 	// }
// 	}
// }

// function sendCommands (configFileLocation) {
// 	console.log('Dirname: ' + __dirname);
// 	console.log('Config location: '+configFileLocation);
// 	fs.readFile(__dirname + '/' + configFileLocation, 'utf8', (err, data) => {
// 		if (err) throw err;
// 		let parsed;
// 		console.log(data);
// 		try {
// 			parsed = JSON.parse(data);
// 		} catch (e) {
// 			console.log(e);
// 		}
// 		const signaling = ioClient(parsed.sshAddress);
// 		console.log(signaling);
// 		console.log('SSH Server adress: ' + parsed.sshAddress);
// 		if(parsed.commands.length > 0) {
// 			parsed.commands.forEach( obj => {
// 				console.log(obj);
// 				signaling.emit('remoteCommand', {
// 					id: uuid(),
// 					before: function () {
// 						setTimeout( function () {
// 							console.log('Remote connection wait '+ obj.timeout + ' ms');
// 						}, obj.timeout);
// 					},
// 					name: obj.command,
// 					args: obj.args,
// 					after: function () {
// 						console.log('Remote connection. ');
// 					}
// 				});
// 			});
// 			console.log('finished');
// 		} // end if commands
// 	}); // end readfile
// } // end sendCommands
