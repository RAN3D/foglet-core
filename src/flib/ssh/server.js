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
	let clients = {};

	function log (message, verbose) {
		if(verbose) {
			console.log('[SSH-SERVER]', message);
		}
	}

	ioServer.on('connection', function (socket) {
		number++;
		console.log('People: #=' + number);
		socket.on('remoteOrder', (data) => {
			socket.broadcast.emit('remoteCommand', data);
		});

		socket.on('disconnect', () => {
			number--;
		});
	});



	httpServer.listen(port, function () {
		log('HTTP Server listening on port ' + port);
	});
}

module.exports = { init };
