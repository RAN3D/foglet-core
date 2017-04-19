'use strict';

let Foglet = require('../src/foglet.js').Foglet;

describe('[FOGLET] Connection and Disconnection', function () {
	this.timeout(30000);
	it('[FOGLET] connection return true when connected', function (done) {
			let f = new Foglet({
				verbose:true,
				protocol:'rpsExampleConnected',
				webrtc:	{
					trickle: true,
					iceServers: []
				},
				room: 'rpsExampleConnected'
			});

			let f1 = new Foglet({
				verbose:true,
				protocol:'rpsExampleConnected',
				webrtc:	{
					trickle: true,
					iceServers: []
				},
				room: 'rpsExampleConnected'
			});
			f.connection(f1).then( (status) => {
					assert(true, status, 'Status Must be true.');
					done();
			});
	});// END IT
});// END of second describe


describe('[FOGLET:FREGISTER]', function () {
	this.timeout(30000);
	it('set a value and return the correct value', function () {
		let f = new Foglet({
			protocol:'fregister',
			webrtc:	{
				trickle: true,
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
		let f1 = new Foglet({
			protocol:'antientropy',
			webrtc:	{
				trickle: true,
				iceServers: []
			},
			timeout: 1000 * 60 * 2,
			deltatime: 10000,
			room: 'antientropy',
			delta: 1000,
			timeBeforeStart: 1000
		});

		let f2 = new Foglet({
			protocol:'antientropy',
			webrtc:	{
				trickle: true,
				iceServers: []
			},
			timeout: 1000 * 60 * 2,
			deltatime: 10000,
			room: 'antientropy',
			delta: 1000,
			timeBeforeStart: 1000
		});
		let f3 = new Foglet({
			protocol:'antientropy',
			webrtc:	{
				trickle: true,
				iceServers: []
			},
			timeout: 1000 * 60 * 2,
			deltatime: 10000,
			room: 'antientropy',
			delta: 1000,
			timeBeforeStart: 1000
		});

		// INIT FOGLETS
		f1.addRegister('test');
		f1.getRegister('test').setValue('testValue');
		f1.connection(f2).then( () => {
			f3.connection(f2).then( () => {
				f3.addRegister('test');
				setTimeout(() => {
					assert(f3.getRegister('test').getValue(), 'testValue');
					done();
				}, 5000);
			});
		});
	});// END IT

	it('onRegister()', function (done) {
		let f = new Foglet({
			protocol:'rpsOnregister',
			webrtc:	{
				trickle: true,
				iceServers: []
			},
			room: 'rpsOnregister'
		});

		let f2 = new Foglet({
			protocol:'rpsOnregister',
			webrtc:	{
				trickle: true,
				iceServers: []
			},
			room: 'rpsOnregister'
		});

		f.addRegister('test');
		f2.addRegister('test');
		f2.onRegister('test', (data) =>{
			assert(data, 5);
			done();
		});

		f.connection(f2).then( () => {
			setTimeout(() => {
				f.getRegister('test').setValue(5);
			}, 5000);
		});
	});
});



describe('[FOGLET] Other functions tests', function () {
	this.timeout(30000);
	it('[FOGLET] getRandomNeighbourId is in getNeighbours', function (done) {
		let f1 = new Foglet({
			protocol:'neighbours',
			webrtc:	{
				trickle: true,
				iceServers: []
			},
			room: 'neighbours'
		});
		let f2 = new Foglet({
			protocol:'neighbours',
			webrtc:	{
				trickle: true,
				iceServers: []
			},
			room: 'neighbours'
		});

		f1.connection(f2).then( () => {
			console.log('Peers: ', f1.getNeighbours(), f2.getNeighbours());
			console.log('Random:', f1.getRandomNeighbourId(), f2.getRandomNeighbourId());
			// assert(f1.getNeighbours().includes(f1.getRandomNeighbourId()));
			done();
		});
	});
	it('[FOGLET] _fRegisterKey()', function (done) {
		let fog = new Foglet({
			protocol:'_fRegisterKey',
			webrtc:	{
				trickle: true,
				iceServers: []
			},
			room: '_fRegisterKey'
		});

		const test = {
			name : 'test'
		};
		try {
			assert(fog._fRegisterKey(test), 'test');
			done();
		} catch (error) {
			console.log(error);
			done(error);
		}
	});
});
