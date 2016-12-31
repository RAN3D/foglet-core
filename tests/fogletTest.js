var Spray = require("spray-wrtc");

var Foglet = require('../src/foglet.js');
var FRegister = require('../src/fregister.js').FRegister;
var InitConstructException = require('../src/fexceptions.js').InitConstructException;
var ConstructException = require('../src/fexceptions.js').ConstructException;
var FRegisterConstructException = require('../src/fexceptions.js').FRegisterConstructException;
var FRegisterAddException = require('../src/fexceptions.js').FRegisterAddException;
var $ = require("jquery");
/*************************************************************
 *************************************************************
 *************************************************************/

describe('[FOGLET:INIT]', function () {
	describe('#Init without option', function () {
		it('init throw InitConstructException when there is no option', function () {
			var fn = function () {
				(new Foglet())();
			};
			expect(fn).to.throw(InitConstructException);
		});
	});
	describe('#Init with options', function () {
		it('init() throw a ConstructException when needed options are undefined', function () {
			var fn = function () {
				(new Foglet({
					spray:null,
					protocol: null,
					room: null
				}))();
			};
			expect(fn).to.throw(ConstructException);
		});
		it('init() set the correct status with correct options', function () {
			var f = new Foglet({
				spray: new Spray({
					protocol:"test",
			    webrtc:	{
			      trickle: true,
						iceServers: [{urls: ['stun:23.21.150.121:3478',
							'stun:stun.l.google.com:19305',
							'stun:stun2.l.google.com:19305',
						 	'stun:stun3.l.google.com:19305',
							'stun:stun4.l.google.com:19305',
						]}]
			    }
				}),
				protocol: 'test',
				room: 'test'
			});
			assert(f.status, 'initialized', 'Return a correct status after initialization');
			f.disconnect();
		});
	});
	describe('#Connection', function () {
		this.timeout(15000);
		it('connection return connected as status', function (done) {
			$.ajax({
			  url : "https://service.xirsys.com/ice",
			  data : {
			    ident: "folkvir",
			    secret: "a0fe3e18-c9da-11e6-8f98-9ac41bd47f24",
			    domain: "foglet-examples.herokuapp.com",
			    application: "foglet-examples",
			    room: "test",
			    secure: 1
			  }
			  , success:function(response, status){
			    console.log(status);
			    console.log(response);
			    /**
			     * Create the foglet protocol.
			     * @param {[type]} {protocol:"chat"} [description]
			     */
			    var iceServers = [];
			     if(response.d.iceServers){
			       iceServers = response.d.iceServers;
			     }

			    var f = new Foglet({
			    	spray: new Spray({
 			       protocol:"sprayExample",
 			       webrtc:	{
 			         trickle: true,
 			         iceServers: iceServers
 			       }
 			     }),
			    	protocol: 'sprayExample',
			    	room: 'test'
			    });

					var f1 = new Foglet({
			    	spray: new Spray({
 			       protocol:"sprayExample",
 			       webrtc:	{
 			         trickle: true,
 			         iceServers: iceServers
 			       }
 			     }),
			    	protocol: 'sprayExample',
			    	room: 'test'
			    });

					f.init();
					f1.init();
					// @Firefox: we are waiting for the initialization is well established.
					setTimeout(function(){
						f1.connection().then(function(){
							assert(f.status, f1.status, "status need to be 'connected' !");
							done();
						},function(error){
							console.log(error);
							done();
						});
					}, 2000);
					f.disconnect();
					f1.disconnect();

				}
			});//END AJAX

		});//END IT
	});//END DESCRIBE
});

describe('[FOGLET:FREGISTER]', function () {
	describe('#addRegister without option', function () {
		it('should return a FRegisterConstructException when no option', function () {
			var fn = function () {
				(new FRegister())();
			};
			expect(fn).to.throw(FRegisterConstructException);
		});
		it('should return a FRegisterConstructException when options whit null value', function () {
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
	});
	describe('#addRegister with well-formed options', function () {
		it('A register should have a name', function () {
			var fn = function () {
				var f = new Foglet({
					spray: new Spray({
						protocol:"test",
				    webrtc:	{
				      trickle: true,
							iceServers: [{urls: ['stun:23.21.150.121:3478',
								'stun:stun.l.google.com:19305',
								'stun:stun2.l.google.com:19305',
							 	'stun:stun3.l.google.com:19305',
								'stun:stun4.l.google.com:19305',
							]}]
				    }
					}),
					protocol: 'test',
					room: 'test'
				});
				f.addRegister();
			};
			expect(fn).to.throw(FRegisterAddException);
		});
		it('set a value and return the correct value', function () {
			var f = new Foglet({
				spray: new Spray({
					protocol:"test",
			    webrtc:	{
			      trickle: true,
						iceServers: [{urls: ['stun:23.21.150.121:3478',
							'stun:stun.l.google.com:19305',
							'stun:stun2.l.google.com:19305',
						 	'stun:stun3.l.google.com:19305',
							'stun:stun4.l.google.com:19305',
						]}]
			    }
				}),
				protocol: 'test',
				room: 'test'
			});
			f.init();
			f.addRegister('test');
			f.getRegister('test').setValue('a_value');
			let result = f.getRegister('test').getValue();
			assert.equal(result, 'a_value', 'Return the correct value');
			f.disconnect();
		});
		it('AntyEntropy test',function(){

			$.ajax({
			  url : "https://service.xirsys.com/ice",
			  data : {
			    ident: "folkvir",
			    secret: "a0fe3e18-c9da-11e6-8f98-9ac41bd47f24",
			    domain: "foglet-examples.herokuapp.com",
			    application: "foglet-examples",
			    room: "test",
			    secure: 1
			  }
			  , success:function(response, status){
			    console.log(status);
			    console.log(response);
			    /**
			     * Create the foglet protocol.
			     * @param {[type]} {protocol:"chat"} [description]
			     */
			    var iceServers = [];
			     if(response.d.iceServers){
			       iceServers = response.d.iceServers;
			     }

			    var f = new Foglet({
			    	spray: new Spray({
 			       protocol:"sprayExample",
 			       webrtc:	{
 			         trickle: true,
 			         iceServers: iceServers
 			       }
 			     }),
			    	protocol: 'sprayExample',
			    	room: 'test'
			    });

					var f2 = new Foglet({
			    	spray: new Spray({
 			       protocol:"sprayExample",
 			       webrtc:	{
 			         trickle: true,
 			         iceServers: iceServers
 			       }
 			     }),
			    	protocol: 'sprayExample',
			    	room: 'test'
			    });

					//INIT FOGLETS
					f.init();
					f2.init();

					// ADD AND TEST THE FIRST REGISTER
					f.addRegister('test');
					var register = f.getRegister("test");
					register.setValue("testValue");

					f.connection();
					f2.connection();

					f2.addRegister('test');

					//code before the pause
					setTimeout(function(){
							var register2 = f2.getRegister("test");
					    var val = resgiter2.getValue();
							assert(val,'testValue','Should be the right value.');
							f.disconnect();
							f2.disconnect();
					}, 2000);

				}
			});//END AJAX
		});//END IT
	});
});
