var Spray = require("spray-wrtc");

var Foglet = require('../src/foglet.js');
var FRegister = require('../src/fregister.js').FRegister;
var InitConstructException = require('../src/fexceptions.js').InitConstructException;
var ConstructException = require('../src/fexceptions.js').ConstructException;
var FRegisterConstructException = require('../src/fexceptions.js').FRegisterConstructException;
var FRegisterAddException = require('../src/fexceptions.js').FRegisterAddException;
var $ = require("jquery");
var Q = require("q");
/*************************************************************
 *************************************************************
 *************************************************************/

describe('[FOGLET:INIT]', function () {
	describe('#Init with options', function () {
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
	describe('[FOGLET] Connection and Disconnection', function () {
		this.timeout(15000);
		it('[FOGLET] connection return connected as status', function (done) {
				$.ajax({
				  url : "https://service.xirsys.com/ice",
				  data : {
				    ident: "folkvir",
				    secret: "a0fe3e18-c9da-11e6-8f98-9ac41bd47f24",
				    domain: "foglet-examples.herokuapp.com",
				    application: "foglet-examples",
				    room: "test",
				    secure: 1
				  }}).then(function(response, status){
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
	 			       protocol:"sprayExampleConnected",
	 			       webrtc:	{
	 			         trickle: true,
	 			         iceServers: iceServers
	 			       }
	 			     }),
				    	protocol: 'sprayExampleConnected',
				    	room: 'test'
				    });

						var f1 = new Foglet({
				    	spray: new Spray({
	 			       protocol:"sprayExampleConnected",
	 			       webrtc:	{
	 			         trickle: true,
	 			         iceServers: iceServers
	 			       }
	 			     }),
				    	protocol: 'sprayExampleConnected',
				    	room: 'test'
				    });

						f.init();
						f1.init();
						// @Firefox: we are waiting for the initialization is well established.
						f1.connection().then(function(status){
							assert('connected', status, 'need to be connected !!');
							done();
						},function(error){
							console.log(error);
						});


					}, function( jqXHR, textStatus, errorThrown ) {  });//END then ajax


		});//END IT
		it('[FOGLET] disconnection return disconnected as status', function (done) {
			$.ajax({
				url : "https://service.xirsys.com/ice",
				data : {
					ident: "folkvir",
					secret: "a0fe3e18-c9da-11e6-8f98-9ac41bd47f24",
					domain: "foglet-examples.herokuapp.com",
					application: "foglet-examples",
					room: "test",
					secure: 1
				}}).then(function(response, status){
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
						 protocol:"sprayExampleConnected",
						 webrtc:	{
							 trickle: true,
							 iceServers: iceServers
						 }
					 }),
						protocol: 'sprayExampleConnected',
						room: 'test'
					});

					var f1 = new Foglet({
						spray: new Spray({
						 protocol:"sprayExampleConnected",
						 webrtc:	{
							 trickle: true,
							 iceServers: iceServers
						 }
					 }),
						protocol: 'sprayExampleConnected',
						room: 'test'
					});

					f.init();
					f1.init();
					// @Firefox: we are waiting for the initialization is well established.
					f1.connection().then(function(statusConnected){
						f.disconnect().then(function(statusDisconnected){
							assert(statusDisconnected, 'disconnected', 'need to be disconnected !!');
						});
						f1.disconnect().then(function(statusDisconnected){
							assert(statusDisconnected, 'disconnected', 'need to be disconnected !!');
							done();
						});
					},function(error){
						console.log(error);
					});


				}, function( jqXHR, textStatus, errorThrown ) {  });//END then ajax
		});
	});//END DESCRIBE
});

describe('[FOGLET:FREGISTER]', function () {
	this.timeout(15000);
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
	it('AntyEntropy test', function () {
		$.ajax({
		  url : "https://service.xirsys.com/ice",
		  data : {
		    ident: "folkvir",
		    secret: "a0fe3e18-c9da-11e6-8f98-9ac41bd47f24",
		    domain: "foglet-examples.herokuapp.com",
		    application: "foglet-examples",
		    room: "test",
		    secure: 1
		  }}).then(function(response, status){
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
			       protocol:"sprayExampleAntiEntropy",
			       webrtc:	{
			         trickle: true,
			         iceServers: iceServers
			       }
			     }),
		    	protocol: 'sprayExampleAntiEntropy',
		    	room: 'test'
		    });

				var f2 = new Foglet({
		    	spray: new Spray({
			       protocol:"sprayExampleAntiEntropy",
			       webrtc:	{
			         trickle: true,
			         iceServers: iceServers
			       }
			     }),
		    	protocol: 'sprayExampleAntiEntropy',
		    	room: 'test'
		    });

				//INIT FOGLETS
				f.init();
				f2.init();

				f.connection().then(function(){
					// ADD AND TEST THE FIRST REGISTER
					f.addRegister('test');
					f.getRegister("test").setValue("testValue");

					//code before the pause
					setTimeout(function(){
							//f2.addRegister('test');
							//var register2 = f2.getRegister("test");
					    //var val = resgiter2.getValue();
							assert(f.getRegister("test").getValue(),'toto','Should be the right value.');
							f.disconnect();
							f2.disconnect();
							done();
					}, 3000);
				});
			}, function(error){
				console.log(error);
				done(error);
			});//END THEN OF PROMISE
	});//END IT

	it('[FOGLET] onRegister()', function (done) {
		$.ajax({
		  url : "https://service.xirsys.com/ice",
		  data : {
		    ident: "folkvir",
		    secret: "a0fe3e18-c9da-11e6-8f98-9ac41bd47f24",
		    domain: "foglet-examples.herokuapp.com",
		    application: "foglet-examples",
		    room: "test",
		    secure: 1
		  }}).then(function(response, status){
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
			       protocol:"sprayOnregister",
			       webrtc:	{
			         trickle: true,
			         iceServers: iceServers
			       }
			     }),
		    	protocol: 'sprayOnregister',
		    	room: 'test'
		    });

				var f2 = new Foglet({
		    	spray: new Spray({
			       protocol:"sprayOnregister",
			       webrtc:	{
			         trickle: true,
			         iceServers: iceServers
			       }
			     }),
		    	protocol: 'sprayOnregister',
		    	room: 'test'
		    });

				f.init();
				f2.init();

				f.connection().then(function(){
					f.addRegister("test");
					f2.addRegister("test");

					var test = 5 ;
					f.onRegister("test",function(){
						test = 10;
						console.log("Value of the test : " + test);
					});

					f.getRegister("test").setValue(5);

					assert(test, 10, "onRegister callback need to set the value to 10");
					done();
				}, function(error){
					console.log(error);
				});
		});




	});
});

describe('[FOGLET] Other functions tests', function () {
	this.timeout(15000);
	it('[FOGLET] _flog()', function (done) {
		var fog = new Foglet({
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


		try {
			fog._flog("test of the function _flog");
			done();
		} catch (error) {
			done(error);
		}
	});
	it('[FOGLET] _getParameterByName(name, url)', function (done) {
		var fog = new Foglet({
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


		try {
			var param = fog._getParameterByName('server', 'http://localhost:3000?server=mytest');
			assert(param,'mytest', 'need to be mystest as value');
			done();
		} catch (error) {
			done(error);
		}
	});
});
