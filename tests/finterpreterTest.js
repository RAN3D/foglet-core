var Spray = require("spray-wrtc");

var Foglet = require('../src/foglet.js');
const FInterpreter = require('../src/finterpreter.js').FInterpreter;
var $ = require("jquery");
var Q = require("q");

describe('[FInterpreter] Finterpreter functions', function () {
	this.timeout(15000);

	it('[FInterpreter] executeBroadcast', function (done) {
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
				 var f1 = new Foglet({
		 			spray: new Spray({
		 				protocol:"interpreter-test-broadcast",
		 				webrtc:	{
		 					trickle: true,
		 					iceServers: iceServers
		 				}
		 			}),
		 			room: 'interpreter-test-broadcast'
		 		});
		 		var f2 = new Foglet({
		 			spray: new Spray({
		 				protocol:"interpreter-test-broadcast",
		 				webrtc:	{
		 					trickle: true,
		 					iceServers: iceServers
		 				}
		 			}),
		 			room: 'interpreter-test-broadcast'
		 		});


				try {
					f1.init();
					f2.init();
				} catch (e) {
					console.log(e);
				}

        let cpt = 0;
				const totalResult = 2;


				f1.onBroadcast('receive', (message) => {
					console.log("f1----------------------------------------------");
					console.log(message);
					console.log("f1----------------------------------------------");
					cpt++;
					console.log(cpt);
					if(cpt === totalResult){
						done();
					}
    		});


        f2.interpreter.on(f2.interpreter.signalBroadcast, (result, message) => {
    			f2.interpreter._flog('A broadcast Command : ' + message.name + '(' + message.args + ') has been emit for The Interpreter Result : ' + result);
          cpt++;
					console.log(cpt);
					if(cpt === totalResult){
						done();
					}
    		});

		 		f1.connection().then( () => {
					return f2.connection()
				}).then( s => {

						let a = f1.interpreter.executeBroadcast("sendBroadcast", [ 'miaousssssss' ]);

		 		}).catch(error => {
					console.log(error);
					done();
				});
		});
	});

	it('[FInterpreter] executeUnicast', function (done) {
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
				 var f1 = new Foglet({
		 			spray: new Spray({
		 				protocol:"interpreter-test-unicast",
		 				webrtc:	{
		 					trickle: true,
		 					iceServers: iceServers
		 				}
		 			}),
		 			room: 'interpreter-test-unicast'
		 		});
		 		var f2 = new Foglet({
		 			spray: new Spray({
		 				protocol:"interpreter-test-unicast",
		 				webrtc:	{
		 					trickle: true,
		 					iceServers: iceServers
		 				}
		 			}),
		 			room: 'interpreter-test-unicast'
		 		});


				try {
					f1.init();
					f2.init();
				} catch (e) {
					console.log(e);
				}

        let cpt = 0;
				const totalResult = 2;


				f1.onUnicast((id, message) => {
					console.log("f1----------------------------------------------");
					console.log(message);
					console.log("f1----------------------------------------------");
					cpt++;
					console.log(cpt);
					if(cpt === totalResult){
						done();
					}
    		});

    		f2.interpreter.on(f2.interpreter.signalUnicast, (result, id, message) => {
    			f2.interpreter._flog('A Unicast Command : ' + message.name + '(' + message.args + ') has been emit for The Interpreter Result : ' + result);
          cpt++;
					console.log(cpt);
          if(cpt === totalResult){
						done();
					}
    		});
		 		f1.connection().then( () => {
					return f2.connection()
				}).then( s => {

						let b = f1.interpreter.executeUnicast("sendUnicast", [ 'miaousssssss' , f2.getNeighbours()[0] ] , f1.getNeighbours()[0]);


		 		}).catch(error => {
					console.log(error);
					done();
				});
		});
	});

	it('[FInterpreter] Map', function (done) {
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
				 var f1 = new Foglet({
		 			spray: new Spray({
		 				protocol:"interpreter-map",
		 				webrtc:	{
		 					trickle: true,
		 					iceServers: iceServers
		 				}
		 			}),
		 			room: 'interpreter-map'
		 		});
		 		var f2 = new Foglet({
		 			spray: new Spray({
		 				protocol:"interpreter-map",
		 				webrtc:	{
		 					trickle: true,
		 					iceServers: iceServers
		 				}
		 			}),
		 			room: 'interpreter-map'
		 		});


				try {
					f1.init();
					f2.init();
				} catch (e) {
					console.log(e);
				}

        let cpt = 0;
				const totalResult = 1;


				f1.interpreter.on(f1.interpreter.signalBroadcast+'-custom', (result, message) => {
					console.log("f1----------------------------------------------");
					console.log(message);
					console.log(result);
					console.log("f1----------------------------------------------");
					cpt++;
					console.log(cpt);
					if(cpt === totalResult){
						done();
					}
    		});

		 		f1.connection().then( () => {
					return f2.connection()
				}).then( s => {

						let c = f1.interpreter.executeCustom('views', (jobId, foglet, val, emitter) => {
							console.log(val);
							emitter(jobId, 'myKeys', val);
						});

		 		}).catch(error => {
					console.log(error);
					done();
				});
		});
	});

	it('[FInterpreter] Map/Reduce', function (done) {
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
			var f1 = new Foglet({
				spray: new Spray({
					protocol:"interpreter-mapreduce",
					webrtc:	{
						trickle: true,
						iceServers: iceServers
					}
				}),
				room: 'interpreter-mapreduce'
			});
			var f2 = new Foglet({
				spray: new Spray({
					protocol:"interpreter-mapreduce",
					webrtc:	{
						trickle: true,
						iceServers: iceServers
					}
				}),
				room: 'interpreter-mapreduce'
			});

			var f3 = new Foglet({
				spray: new Spray({
					protocol:"interpreter-mapreduce",
					webrtc:	{
						trickle: true,
						iceServers: iceServers
					}
				}),
				room: 'interpreter-mapreduce'
			});


			try {
				f1.init();
				f2.init();
			} catch (e) {
				console.log(e);
			}

			let cpt = 0;
			const totalResult = 2;

			f1.connection().then( () => {
				return f2.connection()
			}).then( () => {
				f3.init();
				return f3.connection()
			}).then( s => {


					let c = f1.interpreter.mapReduce('views', (jobId, foglet, val, emitter) => {
						emitter(jobId, 'myKeys', val);
					}, (result, message) => {
						cpt++;
						console.log('JobId: ' + result.jobId);
						console.log('Result: ');
						console.log(result);
						if(cpt === totalResult){
							done();
						}
					});

			}).catch(error => {
				console.log(error);
				done(error);
			});
		}); // end ajax
	}); //end it
});//end describe
