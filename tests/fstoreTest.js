'use strict';

const Foglet = require('../src/foglet.js');

describe('[FSTORE] FStore functions', function () {
	it('[FStore] init', function () {
		let f = new Foglet({
			protocol: 'fstore-test-init',
			webrtc:	{
				trickle: false,
				iceServers: []
			},
			room: 'fstore-test-init'
		});
		console.log(f.store.getStore());
		f.store.has('views').should.be.true;
	});

	it('[FStore] insert', function () {
		let f = new Foglet({
			protocol: 'fstore-test-insert',
			webrtc:	{
				trickle: false,
				iceServers: []
			},
			room: 'fstore-test-insert'
		});

		f.store.insert('testingValue', { 'a' : 1 });
		console.log(f.store.getStore());
		f.store.has('testingValue').should.be.true;
		f.store.get('testingValue').should.be.an('object');
		f.store.get('testingValue').a.should.be.equal(1);
	});

	it('[FStore] update', function () {
		let f = new Foglet({
			protocol: 'fstore-test-update',
			webrtc:	{
				trickle: false,
				iceServers: []
			},
			room: 'fstore-test-update'
		});

		f.store.insert('testingValue', { 'a' : 1 })
		console.log(f.store.getStore());
		f.store.has('testingValue').should.be.true;
		f.store.get('testingValue').should.be.an('object');
		f.store.get('testingValue').a.should.be.equal(1);
		f.store.update('testingValue', { 'a' : 2 });
		console.log(f.store.getStore());
		f.store.get('testingValue').a.should.be.equal(2);
	});

	it('[FStore] delete', function () {
		let f = new Foglet({
			protocol: 'fstore-test-delete',
			webrtc:	{
				trickle: false,
				iceServers: []
			},
			room: 'fstore-test-delete'
		});

		f.store.insert('testingValue', { 'a' : 1 });
		f.store.has('testingValue').should.be.true;
		f.store.delete('testingValue');
		f.store.has('testingValue').should.be.false;
	});
});
