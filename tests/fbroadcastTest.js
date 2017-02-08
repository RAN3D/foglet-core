'use strict';

const Spray = require('spray-wrtc');
const Foglet = require('../src/foglet.js');
const FBroadcast = require('../src/fbroadcast.js').FBroadcast;
const $ = require('jquery');

describe('[FBROADCAST] functions', function () {
	this.timeout(15000);
	it('send', function (done) {
		$.ajax({
			url: 'https://service.xirsys.com/ice',
			data: {
				ident: 'folkvir',
				secret: 'a0fe3e18-c9da-11e6-8f98-9ac41bd47f24',
				domain: 'foglet-examples.herokuapp.com',
				application: 'foglet-examples',
				room: 'test',
				secure: 1
			}
		}).then(function (response, status) {
			console.log(status);
			console.log(response);

			let iceServers = [];
			if (response.d.iceServers) {
				iceServers = response.d.iceServers;
			}
			let f1 = new Foglet({
				spray: new Spray({
					protocol: 'interpreter-test-fbroadcast',
					webrtc: {
						trickle: true,
						iceServers: iceServers
					}
				}),
				room: 'interpreter-test-fbroadcast'
			});

			let f2 = new Foglet({
				spray: new Spray({
					protocol: 'interpreter-test-fbroadcast',
					webrtc: {
						trickle: true,
						iceServers: iceServers
					}
				}),
				room: 'interpreter-test-fbroadcast'
			});

			let f3 = new Foglet({
				spray: new Spray({
					protocol: 'interpreter-test-fbroadcast',
					webrtc: {
						trickle: true,
						iceServers: iceServers
					}
				}),
				room: 'interpreter-test-fbroadcast'
			});

			let f1Broadcast = new FBroadcast({
				protocol: 'test',
				foglet: f1,
				size: 1000
			});

			let f2Broadcast = new FBroadcast({
				protocol: 'test',
				foglet: f2,
				size: 1000
			});

			let f3Broadcast = new FBroadcast({
				protocol: 'test',
				foglet: f3,
				size: 1000
			});


			try {
				f1.init();
				f2.init();
			} catch (e) {
				console.log(e.stack);
			}

			let cpt = 0;
			let totalResult = 2;

			f1.connection().then(() => {
				return f2.connection();
			}).then(() => {
				f3.init();
				return f3.connection();
			}).then(() => {
				f2Broadcast.on('receive', (message) => {
					console.log('f2:' + message);
					cpt++;
					if (cpt === totalResult) {
						done();
					}
				});

				f3Broadcast.on('receive', (message) => {
					console.log('f3:' + message);
					cpt++;
					if (cpt === totalResult) {
						done();
					}
				});

				f1Broadcast.send('miaousssssss');
			}).catch(error => {
				console.log(error);
				done();
			});
		}).catch(error => {
			console.log(error);
			done();
		}); // end $
	}); // end it
});
