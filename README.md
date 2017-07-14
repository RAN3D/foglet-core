# foglet-core [![Build Status](https://travis-ci.org/RAN3D/foglet-core.svg?branch=master)](https://travis-ci.org/RAN3D/foglet-core)
Core of the foglet library

This project aims to provide a solid core infrastructure built with spray-wrtc (see references)

There is a [Foglet Live Example](https://ran3d.github.io/foglet-core/example/foglet/foglet.html) of this repository available and some other examples using this package available on https://ran3d.github.io/foglet/ and repository at https://github.com/RAN3D/foglet   

[Documentation]((https://ran3d.github.io/foglet-core/)

## Installation

**Prerequisite**: [a Browser compatible with WebRTC](http://caniuse.com/#feat=rtcpeerconnection)

```bash
npm install --save foglet-core
```

## Documentation

The documentation is avalaible [here online](https://ran3d.github.io/foglet-core/)

## How to use it and write your example ?

Creates a new HTML file and nsert the **foglet bundle** in it:
```html
<script src="node_modules/foglet-core/foglet.bundle.js" type="text/javascript"></script>
```

Then, requires the Foglet library:
- `const MyWonderfullFoglet = require("foglet").Foglet`

If you do not provide a list of **ice servers**, your example will work in localhost but not on the Web.

To be begin with, write a simple piece of JS code:
```html
<script type="text/javascript">
  'use strict';
  const Foglet = require('foglet').Foglet;

  // Construction of the network
  var foglet = new Foglet({
    protocol: 'example-protocol', // choose a protocol to connect your example
    room: 'example-room', // choose a room to connect all the peers through the signaling server
    webrtc:	{
      trickle: true,
      iceServers : []
    },
    signalingAdress:'http://localhost:3000/', // the adress of your signaling server
    rpsType: 'spray-wrtc' // choose your type of Random Peer Sampling network
  });

  // Retreive a message sent by a broadcast
  foglet.onBroadcast(message => {
    console.log('received a broadcast:', message);
  });

  // Connect our Foglet to our example network
  foglet.connection().then(d => {
    console.log('I\'m connected');
    // let's send some messages
    foglet.sendBroadcast('So Long and Thanks for all the Fish!');
  });
</script>
```

Then, open the HTML file and look into the developpers console.
You should see that your foglet has been connected to the RPS.

## Signaling server

In order to run this library, you have to provide the address of a **signaling server** using the `signalingAdress`option.
This server must be compatible with the foglet library.

The library [`foglet-signaling-server`](https://github.com/folkvir/foglet-signaling-server) provides an example implementation of such signaling server.


## Contributors:
* [A. Grall (Folkvir)](https://github.com/folkvir) **Author**
* [Chat-Wane](https://github.com/Chat-Wane/)
* [T. Minier (Callidon)](https://github.com/Callidon)

## References

**About [spray-wrtc](https://github.com/RAN3D/spray-wrtc)**
*Author:* [Chat-Wane](https://github.com/Chat-Wane/)
This project aims to provide a WebRTC implementation of Spray.

Spray is a random peer sampling protocol [1] inspired by both Cyclon [2] and Scamp [3]. It adapts the partial view of each member to the network size using local knowledge only. Therefore, without any configurations, each peer automatically adjust itself to the need of the network.
*Keywords:* Random peer sampling, adaptive, browser-to-browser communication, WebRTC

[1] M. Jelasity, S. Voulgaris, R. Guerraoui, A.-M. Kermarrec, and M. Van Steen. Gossip-based peer sampling. ACM Transactions on Computer Systems (TOCS), 25(3):8, 2007.

[2] S. Voulgaris, D. Gavidia, and M. van Steen. Cyclon: Inexpensive membership management for unstructured p2p overlays. Journal of Network and Systems Management, 13(2):197–217, 2005.

[3] A. Ganesh, A.-M. Kermarrec, and L. Massoulié. Peer-to-peer membership management for gossip-based protocols. IEEE Transactions on Computers, 52(2):139–149, Feb 2003.

[4] A. Montresor and M. Jelasity. Peersim: A scalable P2P simulator. Proc. of the 9th Int. Conference on Peer-to-Peer (P2P’09), pages 99–100, Seattle, WA, Sept. 2009.
