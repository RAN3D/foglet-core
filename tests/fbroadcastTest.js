'use strict';

const Foglet = require('../src/foglet.js');
const FBroadcast = require('../src/flib/fbroadcast.js').FBroadcast;

describe('[FBROADCAST] functions', function () {
	this.timeout(15000);
	it('send', function (done) {
		let f1 = new Foglet({
			protocol: 'interpreter-test-fbroadcast',
			webrtc: {
				trickle: false,
				iceServers: []
			},
			room: 'interpreter-test-fbroadcast'
		});

		let f2 = new Foglet({
			protocol: 'interpreter-test-fbroadcast',
			webrtc: {
				trickle: false,
				iceServers: []
			},
			room: 'interpreter-test-fbroadcast'
		});

		let f3 = new Foglet({
			protocol: 'interpreter-test-fbroadcast',
			webrtc: {
				trickle: false,
				iceServers: []
			},
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

		let cpt = 0;
		let totalResult = 4;

		f1.connection().then(() => {
			f2.connection().then(() => {
				f3.connection().then(() => {
					f1Broadcast.on('receive', (message) => {
						console.log('f1:' + message);
						cpt++;
						if (cpt === totalResult) {
							done();
						}
					});

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

					const ec1 = f1Broadcast.send('miaousssssss1', null, 2000);
					f1Broadcast.send('miaousssssss2', ec1);

					const ec2 = f1Broadcast.send('miaousssssss3', null, 4000);
					f1Broadcast.send('miaousssssss4', ec2, 2000);
				}).catch(error => {
					console.log(error);
					done(error);
				});
			});
		})
	}); // end it
});
