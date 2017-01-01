var Spray = require("spray-wrtc");

var Foglet = require('../src/foglet.js');
var FRegister = require('../src/fregister.js').FRegister;

var InitConstructException = require('../src/fexceptions.js').InitConstructException;
var ConstructException = require('../src/fexceptions.js').ConstructException;
var FRegisterConstructException = require('../src/fexceptions.js').FRegisterConstructException;
var FRegisterAddException = require('../src/fexceptions.js').FRegisterAddException;

describe('[FOGLET:EXCEPTION]', function () {
	describe('#InitConstructException has 2 properties', function () {
		it('has property named InitConstructException', function () {
			expect(new InitConstructException()).to.have.property('name', 'InitConstructException');
		});
		it('has property message', function () {
			expect(new InitConstructException()).to.have.property('message');
		});
	});
	describe('#ConstructException has 2 properties', function () {
		it('has property named ConstructException', function () {
			expect(new ConstructException()).to.have.property('name', 'ConstructException');
		});
		it('has property message', function () {
			expect(new ConstructException()).to.have.property('message');
		});
	});
	describe('#FRegisterConstructException has 2 properties', function () {
		it('has property named FRegisterConstructException', function () {
			expect(new FRegisterConstructException()).to.have.property('name', 'FRegisterConstructException');
		});
		it('has property message', function () {
			expect(new FRegisterConstructException()).to.have.property('message');
		});
	});
	describe('#FRegisterAddException has 2 properties', function () {
		it('has property named FRegisterAddException', function () {
			expect(new FRegisterAddException()).to.have.property('name', 'FRegisterAddException');
		});
		it('has property message', function () {
			expect(new FRegisterConstructException()).to.have.property('message');
		});
	});


	describe('#Throw well-formed exceptions', function () {
		it('[Foglet] init throw InitConstructException when there is no option', function () {
			var fn = function () {
				(new Foglet())();
			};
			expect(fn).to.throw(InitConstructException);
		});
		it('[Foglet] init() throw a ConstructException when needed options are undefined', function () {
			var fn = function () {
				(new Foglet({
					spray:null,
					protocol: null,
					room: null
				}))();
			};
			expect(fn).to.throw(ConstructException);
		});

		it('[Register] should return a FRegisterConstructException when no option', function () {
			var fn = function () {
				(new FRegister())();
			};
			expect(fn).to.throw(FRegisterConstructException);
		});
		it('[Register] should return a FRegisterConstructException when options whit null value', function () {
			var fn = function () {
				(new FRegister({
					name: null,
					spray: null,
					vector: null,
					broadcast: null
				}))();
			};
			expect(fn).to.throw(FRegisterConstructException);
		});
		it('[Register] A register should have a name', function () {
			var fn = function () {
				var f = new Foglet({
					spray: new Spray({
						protocol:"test",
				    webrtc:	{
				      trickle: true,
							iceServers: []
				    }
					}),
					protocol: 'test',
					room: 'test'
				});
				f.addRegister();
			};
			expect(fn).to.throw(FRegisterAddException);
		});
	});
});
