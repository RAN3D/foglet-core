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
			socket.join('clients');
		});

		socket.on('remoteOrder', (data) => {
			log('Command received: ', data);
			let parsed;
			try {
				parsed = JSON.parse(data);
			} catch (e) {
				console.log(e)
			}
			let browsers = ioServer.sockets.adapter.rooms[ 'clients' ] && ioServer.sockets.adapter.rooms[ 'clients' ].sockets;
			let cpt = 0;
			for (let b in browsers) {
				cpt++;
				setTimeout(() => {
					ioServer.sockets.connected[b].emit('remoteCommand', data);
				}, cpt * parsed.timeout);
			}
		});

		socket.on('logs', (data) => {
			log('Logs received from ID:'+ socket.idFoglet, data);
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
