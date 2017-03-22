'use strict';

const Foglet = require('../src/foglet.js');
const FBroadcast = require('../src/flib/fbroadcast.js').FBroadcast;

describe('[FBROADCAST] functions', function () {
	this.timeout(30000);
	it('sendBroadcast with ordered message on 3 peers network', function (done) {
		let f1 = new Foglet({
			protocol: 'test-fbroadcast',
			webrtc: {
				trickle: true,
				iceServers: []
			},
			room: 'test-fbroadcast'
		});

		let f2 = new Foglet({
			protocol: 'test-fbroadcast',
			webrtc: {
				trickle: true,
				iceServers: []
			},
			room: 'test-fbroadcast'
		});

		let f3 = new Foglet({
			protocol: 'test-fbroadcast',
			webrtc: {
				trickle: true,
				iceServers: []
			},
			room: 'test-fbroadcast'
		});

		let f1Broadcast = new FBroadcast({
			protocol: 'test-fbroadcast',
			foglet: f1
		});

		let f2Broadcast = new FBroadcast({
			protocol: 'test-fbroadcast',
			foglet: f2
		});

		let f3Broadcast = new FBroadcast({
			protocol: 'test-fbroadcast',
			foglet: f3
		});

		let cpt = 0;
		let totalResult = 4;

		f1.connection(f2).then(() => {
			f2.connection(f3).then(() => {
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

				const ec1 = f1Broadcast.send('miaousssssss1');
				f1Broadcast.send('miaousssssss2', ec1);

				const ec2 = f1Broadcast.send('miaousssssss3');
				f1Broadcast.send('miaousssssss4', ec2);
			}).catch(error => {
				console.log(error);
				done(error);
			});
		});
	}); // end it
});
