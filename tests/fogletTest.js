'use strict';

let Foglet = require('../src/foglet.js');

describe('[FOGLET:INIT]', function () {
	describe('[FOGLET] Connection and Disconnection', function () {
		this.timeout(15000);
		it('[FOGLET] connection return true when connected', function (done) {
				let f = new Foglet({
					protocol:'sprayExampleConnected',
					webrtc:	{
						trickle: false,
						iceServers: []
					},
					room: 'sprayExampleConnected'
				});

				let f1 = new Foglet({
					protocol:'sprayExampleConnected',
					webrtc:	{
						trickle: false,
						iceServers: []
					},
					room: 'sprayExampleConnected'
				});
				f.connection().then( () => {
					f1.connection().then(function (status) {
						assert(true, status, 'Status Must be true.');
						done();
					},function (error) {
						console.log(error);
					});
				});
		});// END IT
	});// END of second describe
}); // end of first describe


describe('[FOGLET:FREGISTER]', function () {
	this.timeout(15000);
	it('set a value and return the correct value', function () {
		let f = new Foglet({
			protocol:'fregister',
			webrtc:	{
				trickle: false,
				iceServers: []
			},
			room: 'fregister'
		});
		f.addRegister('test');
		f.getRegister('test').setValue('a_value');
		let result = f.getRegister('test').getValue();
		assert.equal(result, 'a_value', 'Return the correct value');
	});
	it('AntyEntropy test', function (done) {
		let f = new Foglet({
			protocol:'antyentropy',
			webrtc:	{
				trickle: false,
				iceServers: []
			},
			timeout: 1000 * 60 * 2,
			deltatime: 10000,
			room: 'antyentropy'
		});
		let f1 = new Foglet({
			protocol:'antyentropy',
			webrtc:	{
				trickle: false,
				iceServers: []
			},
			timeout: 1000 * 60 * 2,
			deltatime: 10000,
			room: 'antyentropy'
		});

		let f2 = new Foglet({
			protocol:'antyentropy',
			webrtc:	{
				trickle: false,
				iceServers: []
			},
			timeout: 1000 * 60 * 2,
			deltatime: 10000,
			room: 'antyentropy'
		});
		let f3 = new Foglet({
			protocol:'antyentropy',
			webrtc:	{
				trickle: false,
				iceServers: []
			},
			timeout: 1000 * 60 * 2,
			deltatime: 10000,
			room: 'antyentropy'
		});

		// INIT FOGLETS
		f1.connection().then( () => {
			f1.addRegister('test');
			f1.getRegister('test').setValue('testValue');
			f2.connection().then( () => {
				setTimeout( () => {
					f3.connection().then( () => {
						f3.addRegister('test');
						setTimeout(() => {
							assert(f3.getRegister('test').getValue(), 'testValue');
							done();
						}, 2000);
					});
				}, 2000);
			});
		});
	});// END IT

	it('onRegister()', function (done) {
		let f = new Foglet({
			protocol:'sprayOnregister',
			webrtc:	{
				trickle: false,
				iceServers: []
			},
			room: 'sprayOnregister'
		});

		let f2 = new Foglet({
			protocol:'sprayOnregister',
			webrtc:	{
				trickle: false,
				iceServers: []
			},
			room: 'sprayOnregister'
		});

		f.addRegister('test');
		f2.addRegister('test');
		f2.onRegister('test', (data) =>{
			assert(data, 5);
			done();
		});

		f.connection().then( () => {
			f2.connection().then(() => {
				setTimeout(() => {
					f.getRegister('test').setValue(5);
				}, 2000);
			});
		});
	});
});

describe('[FOGLET] Broadcast/Unicast/Neighbours', function () {
	this.timeout(15000);
	it('[FOGLET] sendBroadcast/onBroadcast', function (done) {
		let f1 = new Foglet({
			protocol:'test-broadcast',
			webrtc:	{
				trickle: false,
				iceServers: []
			},
			room: 'test-broadcast'
		});
		let f2 = new Foglet({
			protocol:'test-broadcast',
			webrtc:	{
				trickle: false,
				iceServers: []
			},
			room: 'test-broadcast'
		});

		f2.onBroadcast('receive', (data) => {
			console.log(data);
			assert(data, 'hello');
			done();
		});

		f1.connection().then( () => {
			f2.connection().then( () => {
				setTimeout(function () {
					f1.sendBroadcast('hello');
				}, 2000);
			});
		});
	});

	it('[FOGLET] sendUnicast/onUnicast/getNeighbours', function (done) {
		let f1 = new Foglet({
			protocol:'test-unicast',
			webrtc:	{
				trickle: false,
				iceServers: []
			},
			room: 'test-unicast'
		});

		let f2 = new Foglet({
			protocol:'test-unicast',
			webrtc:	{
				trickle: false,
				iceServers: []
			},
			room: 'test-unicast'
		});

		f2.onUnicast((id, message) => {
			console.log(id + ' : ' + message);
			assert(message, 'hello');
			done();
		});

		f1.connection().then( () => {
			f2.connection().then( () => {
				setTimeout(function () {
					const peers = f1.getNeighbours();
					console.log(peers);
					for(let i = 0; i < peers.length; i++) {
						f1.sendUnicast('hello', peers[i]);
					}
				}, 2000);
			});
		});
	});

	it('[FOGLET] getRandomNeighbourId is in getNeighbours', function (done) {
		let f1 = new Foglet({
			protocol:'neighbours',
			webrtc:	{
				trickle: false,
				iceServers: []
			},
			room: 'neighbours'
		});
		let f2 = new Foglet({
			protocol:'neighbours',
			webrtc:	{
				trickle: false,
				iceServers: []
			},
			room: 'neighbours'
		});

		f1.connection().then( () => {
			f2.connection().then( () => {
				const peers = f2.getNeighbours();
				const randomPeer = f2.getRandomNeighbourId();
				console.log(peers);
				console.log(randomPeer);
				assert(peers.includes(randomPeer));
				done();
			}).catch(error => {
				console.log(error);
				done(error);
			});
		})
	});
});

describe('[FOGLET] Other functions tests', function () {
	this.timeout(15000);
	it('[FOGLET] _fRegisterKey()', function (done) {
		let fog = new Foglet({
			protocol:'_fRegisterKey',
			webrtc:	{
				trickle: false,
				iceServers: []
			},
			room: '_fRegisterKey'
		});

		const test = {
			name : 'test'
		};
		try {
			fog._flog('test of the function _fRegisterKey');
			assert(fog._fRegisterKey(test), 'test');
			done();
		} catch (error) {
			console.log(error);
			done(error);
		}
	});
});
