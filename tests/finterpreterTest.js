var Spray = require("spray-wrtc");

var Foglet = require('../src/foglet.js');
const FInterpreter = require('../src/finterpreter.js').FInterpreter;
var $ = require("jquery");
var Q = require("q");

describe('[FInterpreter] Finterpreter functions', function () {
	this.timeout(15000);
	it('[FInterpreter] sendBroadcast/sendUnicast', function (done) {
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
		 				protocol:"interpreter",
		 				webrtc:	{
		 					trickle: true,
		 					iceServers: iceServers
		 				}
		 			}),
		 			room: 'interpreter-broadcast-unicast'
		 		});
		 		var f2 = new Foglet({
		 			spray: new Spray({
		 				protocol:"interpreter",
		 				webrtc:	{
		 					trickle: true,
		 					iceServers: iceServers
		 				}
		 			}),
		 			room: 'interpreter-broadcast-unicast'
		 		});
				try {
					f1.init();
					f2.init();
				} catch (e) {
					console.log(e);
				}

        let cpt = 0;
        f2.interpreter.on(f2.interpreter.signalBroadcast, data => {
    			f2.interpreter._flog('A broadcast message has been emit for The Interpreter');
          cpt++;
					if(cpt === 2){
						done();
					}
    		});

    		f2.interpreter.on(f2.interpreter.signalUnicast, data => {
    			f2.interpreter._flog('A Unicast message has been emit for The Interpreter');
          cpt++;
          if(cpt === 2){
						done();
					}
    		});

		 		f1.connection().then( () => { return f2.connection() }).then( s => {
		 				f1.interpreter.sendBroadcast('hello');
            f1.interpreter.sendUnicast('hello', f1.getNeighbours()[0]);
		 		});
		});
	});
});
