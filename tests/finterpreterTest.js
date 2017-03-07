'use strict';

let Foglet = require('../src/foglet.js');

describe('[FInterpreter] Finterpreter functions', function () {
	this.timeout(15000);

	it('[FInterpreter] executeBroadcast', function (done) {
		let f1 = new Foglet({
			protocol:'interpreter-test-broadcast',
			webrtc:	{
				trickle: false,
				iceServers: []
			},
			deltatime : 1000 * 60,
			room: 'interpreter-test-broadcast'
		});
		let f2 = new Foglet({
			protocol:'interpreter-test-broadcast',
			webrtc:	{
				trickle: false,
				iceServers: []
			},
			deltatime : 1000 * 60,
			room: 'interpreter-test-broadcast'
		});

		let cpt = 0;
		const totalResult = 1;


		f2.onBroadcast('receive', (message) => {
			console.log('f1----------------------------------------------');
			console.log(message);
			console.log('f1----------------------------------------------');
			cpt++;
			console.log(cpt);
			if(cpt === totalResult){
				done();
			}
		});

		f1.connection().then( () => {
			f2.connection().then( () => {
					f2.interpreter.remoteBroadcast('sendBroadcast', [ 'miaousssssss' ]);
			}).catch(error => {
				console.log(error);
				done(error);
			});
		})
	});

	it('[FInterpreter] executeUnicast', function (done) {
		let f1 = new Foglet({
			protocol:'interpreter-test-unicast',
			webrtc:	{
				trickle: false,
				iceServers: []
			},
			deltatime : 1000 * 60,
			room: 'interpreter-test-unicast'
		});
		let f2 = new Foglet({
			protocol:'interpreter-test-unicast',
			webrtc:	{
				trickle: false,
				iceServers: []
			},
			deltatime : 1000 * 60,
			room: 'interpreter-test-unicast'
		});

		let cpt = 0;
		const totalResult = 2;


		f1.onUnicast((id, message) => {
			console.log('f1----------------------------------------------');
			console.log(message);
			console.log('f1----------------------------------------------');
			cpt++;
			console.log(cpt);
			if(cpt === totalResult) {
				done();
			}
		});

		f2.interpreter.on(f2.interpreter.signalUnicast, (result, id, message) => {
			f2.interpreter._flog('A Unicast Command : ' + message.name + '(' + message.args + ') has been emit for The Interpreter Result : ' + result);
			cpt++;
			console.log(cpt);
			if(cpt === totalResult) {
				done();
			}
		});
		f1.connection().then( () => {
			f2.connection().then( () => {
					f1.interpreter.remoteUnicast('sendUnicast', [ 'miaousssssss' , f2.getNeighbours()[0] ] , f1.getNeighbours()[0]);
			}).catch(error => {
				console.log(error);
				done(error);
			});
		})
	});

	it('[FInterpreter] Map', function (done) {
		let f1 = new Foglet({
			protocol:'interpreter-map',
			webrtc:	{
				trickle: false,
				iceServers: []
			},
			deltatime : 1000 * 60,
			room: 'interpreter-map'
		});
		let f2 = new Foglet({
			protocol:'interpreter-map',
			webrtc:	{
				trickle: false,
				iceServers: []
			},
			deltatime : 1000 * 60,
			room: 'interpreter-map'
		});
		let cpt = 0;
		const totalResult = 1;


		f1.interpreter.on(f1.interpreter.signalBroadcast+'-custom', (message) => {
			console.log('f1----------------------------------------------');
			console.log(message);
			console.log('f1----------------------------------------------');
			cpt++;
			console.log(cpt);
			if(cpt === totalResult) {
				done();
			}
		});

		f1.connection().then( () => {
			f2.connection().then( () => {

					f1.interpreter.remoteCustom('views', (jobId, foglet, val, emitter) => {
						emitter(jobId, 'myKeys', val);
					});

			}).catch(error => {
				console.log(error);
				done(error);
			});
		})
	});

	it('[FInterpreter] Map/Reduce', function (done) {
		let f1 = new Foglet({
			protocol:'interpreter-mapreduce',
			webrtc:	{
				trickle: false,
				iceServers: []
			},
			deltatime : 1000 * 60,
			room: 'interpreter-mapreduce'
		});
		let f2 = new Foglet({
			protocol:'interpreter-mapreduce',
			webrtc:	{
				trickle: false,
				iceServers: []
			},
			deltatime : 1000 * 60,
			room: 'interpreter-mapreduce'
		});

		let f3 = new Foglet({
			protocol:'interpreter-mapreduce',
			webrtc:	{
				trickle: false,
				iceServers: []
			},
			deltatime : 1000 * 60,
			room: 'interpreter-mapreduce'
		});

		let cpt = 0;
		const totalResult = 2;

		f1.connection().then( () => {
			f2.connection().then( () => {
				f3.connection().then( () => {
					f1.interpreter.mapReduce('views', (jobId, foglet, val, emitter) => {
						console.log('-----------------------------------');
						console.log(val);
						console.log('-----------------------------------');
						emitter(jobId, 'myKeys', val);
					}, () => {
						cpt++;
						console.log(cpt);
						// console.log('JobId: ' + val.jobId);
						// console.log('Result: ');
						// console.log(val);
						if(cpt === totalResult) {
							done();
						}
					});

				}).catch(error => {
					console.log(error);
					done(error);
				});
			});
		})
	}); //end it
});//end describe
