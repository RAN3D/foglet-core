'use strict';
let express = require('express');
let app = express();
let http = require('http');
let io = require('socket.io');


function init (options) {
	app.use('/static', express.static(__dirname + '/'));

	console.log(__dirname);

	app.get('/', function (req, res) {
		res.sendFile(__dirname + '/index.html');
	});

	let httpServer = http.Server(app);
	let ioServer = io(httpServer);
	let port = options.port;
	let number = 0;
	let savedLogs = [];


	function log (...args) {
		console.log('[SSH-SERVER]', args);
	}

	ioServer.on('connection', function (socket) {
		number++;
		log('Someone enter: People: #=' + number);

		socket.on('join', (data) => {
			socket.idFoglet = data.id;
		});

		socket.on('remoteOrder', (data) => {
			socket.broadcast.emit('remoteCommand', data);
		});

		socket.on('logs', (data) => {
			log('ID:'+ socket.idFoglet, data);
			savedLogs.push(data);
		});

		socket.on('disconnect', () => {
			number--;
			log('Someone quit: People #=' + number);

		});
	});



	httpServer.listen(port, function () {
		log('HTTP Server listening on port ' + port);
	});
}

module.exports = { init };
