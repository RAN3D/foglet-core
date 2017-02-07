var Spray = require("spray-wrtc");

var Foglet = require('../src/foglet.js');
const FInterpreter = require('../src/finterpreter.js').FInterpreter;
var Q = require("q");

describe('[FSTORE] FStore functions', function () {
		it('[FStore] init', function () {
	 		var f = new Foglet({
	 			spray: new Spray({
	 				protocol:"fstore-test-init",
	 				webrtc:	{
	 					trickle: true,
	 					iceServers: []
	 				}
	 			}),
	 			room: 'fstore-test-init'
	 		});

			f.init();
			console.log(f.interpreter.store.getStore());
			f.interpreter.store.has('views').should.be.true;
	});

	it('[FStore] insert', function () {
		var f = new Foglet({
			spray: new Spray({
				protocol:"fstore-test-insert",
				webrtc:	{
					trickle: true,
					iceServers: []
				}
			}),
			room: 'fstore-test-insert'
		});

		f.init();
		f.interpreter.store.insert('testingValue', { 'a' : 1 })
		console.log(f.interpreter.store.getStore());
		f.interpreter.store.has('testingValue').should.be.true;
		f.interpreter.store.get('testingValue').should.be.an('object');
		f.interpreter.store.get('testingValue').a.should.be.equal(1);
	});

	it('[FStore] update', function () {
		var f = new Foglet({
			spray: new Spray({
				protocol:"fstore-test-update",
				webrtc:	{
					trickle: true,
					iceServers: []
				}
			}),
			room: 'fstore-test-update'
		});

		f.init();
		f.interpreter.store.insert('testingValue', { 'a' : 1 })
		console.log(f.interpreter.store.getStore());
		f.interpreter.store.has('testingValue').should.be.true;
		f.interpreter.store.get('testingValue').should.be.an('object');
		f.interpreter.store.get('testingValue').a.should.be.equal(1);
		f.interpreter.store.update('testingValue', { 'a' : 2 })
		console.log(f.interpreter.store.getStore());
		f.interpreter.store.get('testingValue').a.should.be.equal(2);
	});

	it('[FStore] delete', function () {
		var f = new Foglet({
			spray: new Spray({
				protocol:"fstore-test-update",
				webrtc:	{
					trickle: true,
					iceServers: []
				}
			}),
			room: 'fstore-test-update'
		});

		f.init();
		f.interpreter.store.insert('testingValue', { 'a' : 1 })
		f.interpreter.store.has('testingValue').should.be.true;
		f.interpreter.store.delete('testingValue');
		f.interpreter.store.has('testingValue').should.be.false;
	});
});
