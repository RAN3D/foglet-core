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
						iceServers: []
			    }
				}),
				room: 'test'
			});
			assert(f.status, 'initialized', 'Return a correct status after initialization');
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
				    	room: 'sprayExampleConnected'
				    });

						var f1 = new Foglet({
				    	spray: new Spray({
	 			       protocol:"sprayExampleConnected",
	 			       webrtc:	{
	 			         trickle: true,
	 			         iceServers: iceServers
	 			       }
	 			     }),
				    	room: 'sprayExampleConnected'
				    });

						f.init();
						f1.init();
						// @Firefox: we are waiting for the initialization is well established.
						f1.connection().then(function(status){
							assert('connected', status, 'need to be connected !!');
							done()
						},function(error){
							console.log(error);
						});




					}, function( jqXHR, textStatus, errorThrown ) {  });//END then ajax


		});//END IT

		/*it('[FOGLET] disconnect return 0 partialView', function (done) {
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

				    var iceServers = [];
				     if(response.d.iceServers){
				       iceServers = response.d.iceServers;
				     }

				    var f = new Foglet({
				    	spray: new Spray({
	 			       protocol:"sprayExampleDisconnect",
	 			       webrtc:	{
	 			         trickle: true,
	 			         iceServers: iceServers
	 			       }
	 			     }),
				    	protocol: 'sprayExampleDisconnect',
				    	room: 'sprayExampleDisconnect'
				    });

						var f1 = new Foglet({
				    	spray: new Spray({
	 			       protocol:"sprayExampleDisconnect",
	 			       webrtc:	{
	 			         trickle: true,
	 			         iceServers: iceServers
	 			       }
	 			     }),
				    	protocol: 'sprayExampleDisconnect',
				    	room: 'sprayExampleDisconnect'
				    });

						f.init();
						f1.init();
						// @Firefox: we are waiting for the initialization is well established.
						return f1.connection().then(function(status){
							//console.log(status);
							return f1.disconnect().then(() => {
								// assert that we have now 0 neighbour
								assert(f1.spray.partialView.length, 0);
								done();
							});

						}).catch(error => console.err);


					}, function( jqXHR, textStatus, errorThrown ) {  });//END then ajax


		});//END IT */

	});//END DESCRIBE
});

describe('[FOGLET:FREGISTER]', function () {
	this.timeout(15000);
	it('set a value and return the correct value', function () {
		var f = new Foglet({
			spray: new Spray({
				protocol:"fregister",
		    webrtc:	{
		      trickle: true,
					iceServers: []
		    }
			}),
			room: 'fregister'
		});
		f.init();
		f.addRegister('test');
		f.getRegister('test').setValue('a_value');
		let result = f.getRegister('test').getValue();
		assert.equal(result, 'a_value', 'Return the correct value');
	});
	it('AntyEntropy test', function (done) {
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

		    var f1 = new Foglet({
		    	spray: new Spray({
			       protocol:"antyentropy",
			       webrtc:	{
			         trickle: true,
			         iceServers: iceServers
			       },
						 timeout: 1000 * 60 * 2,
						 deltatime: 10000
			     }),
		    	room: 'antyentropy'
		    });

				var f2 = new Foglet({
		    	spray: new Spray({
			       protocol:"antyentropy",
			       webrtc:	{
			         trickle: true,
			         iceServers: iceServers
			       },
						 timeout: 1000 * 60 * 2,
						 deltatime: 10000
			     }),
		    	room: 'antyentropy'
		    });
				var f3 = new Foglet({
					spray: new Spray({
						 protocol:"antyentropy",
						 webrtc:	{
							 trickle: true,
							 iceServers: iceServers
						 },
						 timeout: 1000 * 60 * 2,
						 deltatime: 10000
					 }),
					room: 'antyentropy'
				});


				//INIT FOGLETS
				f1.init();
				f2.init();
				return f1.connection().then( s => {
					f1.addRegister('test');
					f1.getRegister("test").setValue("testValue");
					return f2.connection();
				}).then(s => {
					f3.init();
					setTimeout(function(){
						return f3.connection();
					}, 2000);
				}).then( s => {
					f3.addRegister("test");
					setTimeout(function(){
						assert(f3.getRegister('test').getValue(), 'testValue');
						done();
					}, 2000);
				});

				// f.connection().then(status => {
				// 	// ADD AND TEST THE FIRST REGISTER
				// 	f.addRegister('test');
				// 	f2.addRegister('test');
				// 	f.getRegister("test").setValue("testValue");
				//
				// 	//code before the pause
				// 	setTimeout(function(){
				// 		f2.connection().then( status => {
				// 			console.log("deeeeeeeeeeeeeeeeeeee");
				// 			console.log("rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr");
				// 			f3.addRegister('test');
				// 			console.log(f3.getRegister('test').getValue());
				// 			assert(f3.getRegister('test').getValue(), 'testValue');
				// 			done();
				// 		}).then(status => {
				//
				// 			// setTimeout(function(){
				// 			//
				// 			//
				// 			// }, 2000);
				// 		});
				// 	}, 2000);
				// });
			}, function(error){
				console.log(error);
				done(error);
			});//END THEN OF PROMISE
	});//END IT

	it('onRegister()', function (done) {
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
		    	room: 'sprayOnregister'
		    });

				var f2 = new Foglet({
		    	spray: new Spray({
			       protocol:"sprayOnregister",
			       webrtc:	{
			         trickle: true,
			         iceServers: iceServers
			       }
			     }),
		    	room: 'sprayOnregister'
		    });

				f.init();
				f2.init();
				f.addRegister('test');
				f2.addRegister('test');
				f2.onRegister('test', (data) =>{
					assert(data, 5);
					done();
				});

				f.connection().then( status => {
					setTimeout(function(){
							f.getRegister('test').setValue(5);
					}, 2000);
				});
		});




	});
});

describe('[FOGLET] Broadcast/Unicast/Neighbours', function () {
	this.timeout(15000);
	it('[FOGLET] sendBroadcast/onBroadcast', function (done) {
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
				 var f1 = new Foglet({
		 			spray: new Spray({
		 				protocol:"test-broadcast",
		 				webrtc:	{
		 					trickle: true,
		 					iceServers: iceServers
		 				}
		 			}),
		 			room: 'test-broadcast'
		 		});
		 		var f2 = new Foglet({
		 			spray: new Spray({
		 				protocol:"test-broadcast",
		 				webrtc:	{
		 					trickle: true,
		 					iceServers: iceServers
		 				}
		 			}),
		 			room: 'test-broadcast'
		 		});
		 		f1.init();
		 		f2.init();

		 		f2.onBroadcast('receive', (data) => {
		 			console.log(data);
		 			assert(data, 'hello');
		 			done();
		 		});

		 		return f1.connection().then( s => {
		 			setTimeout(function () {
		 				f1.sendBroadcast('hello');
		 			}, 2000);
		 		});
		});

	});

	it('[FOGLET] sendUnicast/onUnicast/getNeighbours', function (done) {
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

				 var f1 = new Foglet({
		 			spray: new Spray({
		 				protocol:"test-unicast",
		 				webrtc:	{
		 					trickle: true,
		 					iceServers: iceServers
		 				}
		 			}),
		 			room: 'test-unicast'
		 		});
		 		var f2 = new Foglet({
		 			spray: new Spray({
		 				protocol:"test-unicast",
		 				webrtc:	{
		 					trickle: true,
		 					iceServers: iceServers
		 				}
		 			}),
		 			room: 'test-unicast'
		 		});
		 		f1.init();
		 		f2.init();

		 		f2.onUnicast((id, message) => {
		 			console.log(id + " : " + message);
		 			assert(message, 'hello');
		 			done();
		 		});



		 		f1.connection().then( s => {
		 			return f2.connection();
		 		}).then( s => {
		 			setTimeout(function () {
		 				const peers = f1.getNeighbours();
		 				console.log(peers);
		 				for(let i = 0; i < peers.length; i++){
		 						f1.sendUnicast('hello', peers[i]);
		 				}
		 			}, 2000);
		 		}).catch(error => console.log(error));
		});


	});

	it('[FOGLET] getRandomNeighbourId is in getNeighbours', function (done) {
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

				 var f1 = new Foglet({
		 			spray: new Spray({
		 				protocol:"neighbours",
		 				webrtc:	{
		 					trickle: true,
		 					iceServers: iceServers
		 				}
		 			}),
		 			room: 'neighbours'
		 		});
		 		var f2 = new Foglet({
		 			spray: new Spray({
		 				protocol:"neighbours",
		 				webrtc:	{
		 					trickle: true,
		 					iceServers: iceServers
		 				}
		 			}),
		 			room: 'neighbours'
		 		});

		 		f1.init();
		 		f2.init();


		 		f1.connection().then( s => {
		 			return f2.connection();
		 		}).then( s => {
		 				const peers = f1.getNeighbours();
		 				const randomPeer = f1.getRandomNeighbourId();
		 				console.log(peers);
		 				console.log(randomPeer);
		 				assert(peers.includes(randomPeer));
		 				done();
		 		}).catch(error => console.log(error));

		});


	});
});

describe('[FOGLET] Other functions tests', function () {
	this.timeout(15000);
	it('[FOGLET] _flog()', function (done) {
		var fog = new Foglet({
			spray: new Spray({
				protocol:"test:_flog",
				webrtc:	{
					trickle: true,
					iceServers: []
				}
			}),
			room: 'test:_flog'
		});


		try {
			fog._flog("test of the function _flog");
			done();
		} catch (error) {
			done(error);
		}
	});
	it('[FOGLET] _fRegisterKey()', function (done) {
		var fog = new Foglet({
			spray: new Spray({
				protocol:"test:_fRegisterKey",
				webrtc:	{
					trickle: true,
					iceServers: []
				}
			}),
			room: 'test:_fRegisterKey'
		});

		const test = {
			name : 'test'
		};
		try {
			fog._flog('test of the function _fRegisterKey');
			assert(fog._fRegisterKey(test), 'test');
			done();
		} catch (error) {
			done(error);
		}
	});
	it('[FOGLET] _getParameterByName(name, url)', function (done) {
		var fog = new Foglet({
			spray: new Spray({
				protocol:"test:_getparam",
				webrtc:	{
					trickle: true,
					iceServers: []
				}
			}),
			room: 'test:_getparam'
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
