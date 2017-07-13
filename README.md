# foglet-core [![Build Status](https://travis-ci.org/RAN3D/foglet-core.svg?branch=master)](https://travis-ci.org/RAN3D/foglet-core)
Core of the foglet library

This project aims to provide a solid core infrastructure built with spray-wrtc (see references)

There is a [Foglet Live Example](https://ran3d.github.io/foglet-core/example/foglet/foglet.html) of this repository available and some other examples using this package available on https://ran3d.github.io/foglet/ and repository at https://github.com/RAN3D/foglet   

## Install

```bash
npm i --save foglet-core
```
## Documentation

The documentation is avalaible [here](https://ran3d.github.io/foglet-core/)

## 

## How to use it and write your example ?

Insert the foglet.bundle.js in your html file.

The bundle provided offers you to write this require into your browser script :
- ``` const MyWonderfullFoglet = require("foglet").Foglet ```

If you do not provide a list of ice servers your example will not work on the web but will work on your local network.

To be begin here is a simple example, after building the bundle and import it in your html file you can write something like this :
```javascript
     // Require at least those two libraries
     var Foglet = require('foglet').Foglet;

     // Construction of the network

    // Construction of our protocol
    var foglet = new Foglet({
	protocol: '[your-protocol-name]',
	room: '[your-example-name]',
	webrtc:	{
		trickle: true,
		iceServers : []
	},
	signalingAdress:'http://localhost:3000/',
	rpsType: 'spray-wrtc'
    });

    // Retreive a message sent by a broadcast
    foglet.onBroadcast( 'receive', function(message){
      console.log(message);
    });

    // Connect our Foglet to an example
    foglet.connection().then(d => {
			console.log('I\'m connected');
		});

    //Now your example is connected (locally)!
```

## Run

In order to run the library, you have to provide a signaling server compatible with foglet available [here](https://github.com/folkvir/foglet-signaling-server).

Now open http://localhost:3000/


## References

**T. Minier** alias [Callidon](https://github.com/Callidon) :  for contributions on ES6 references and testing tools.

**[Chat-Wane](https://github.com/Chat-Wane/)**:
Keywords: Random peer sampling, adaptive, browser-to-browser communication, WebRTC

This project aims to provide a WebRTC implementation of Spray.

Spray is a random peer sampling protocol [1] inspired by both Cyclon [2] and Scamp [3]. It adapts the partial view of each member to the network size using local knowledge only. Therefore, without any configurations, each peer automatically adjust itself to the need of the network.

[1] M. Jelasity, S. Voulgaris, R. Guerraoui, A.-M. Kermarrec, and M. Van Steen. Gossip-based peer sampling. ACM Transactions on Computer Systems (TOCS), 25(3):8, 2007.

[2] S. Voulgaris, D. Gavidia, and M. van Steen. Cyclon: Inexpensive membership management for unstructured p2p overlays. Journal of Network and Systems Management, 13(2):197–217, 2005.

[3] A. Ganesh, A.-M. Kermarrec, and L. Massoulié. Peer-to-peer membership management for gossip-based protocols. IEEE Transactions on Computers, 52(2):139–149, Feb 2003.

[4] A. Montresor and M. Jelasity. Peersim: A scalable P2P simulator. Proc. of the 9th Int. Conference on Peer-to-Peer (P2P’09), pages 99–100, Seattle, WA, Sept. 2009.
