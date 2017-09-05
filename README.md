<div style='text-align:center'>
<img src="https://octodex.github.com/images/socialite.jpg" width="200" style='text-align:center'><img src="https://octodex.github.com/images/collabocats.jpg" width="200" style='text-align:center'><img src="https://octodex.github.com/images/socialite.jpg" width="200" style='text-align:center'>
<hr/>
</div>

# foglet-core  [![Build Status](https://travis-ci.org/RAN3D/foglet-core.svg?branch=master)](https://travis-ci.org/RAN3D/foglet-core)
Core of the foglet library

This project aims to provide a solid core infrastructure for developping **fog computing applications**.

Nowadays, more and more applications interact with a server (private or in the cloud). These interactions cost a lot, especially if you make an application for a huge number of clients. 

Fog applications communicate to a direct peer of the network instead of relying on a server to forward data to this peer.

There is a huge number of applications and a lot of pros and cons of why and how create a Fog application. We are not here to convince you to absolutely use Fog applications. 

But foglet-core is made to ease your development in that way. 
So **try it** by your-self and **give us your feedback**, we will be happy to answer to your questions ! 

## Installation

**Prerequisite**: [a browser compatible with WebRTC](http://caniuse.com/#feat=rtcpeerconnection)

```bash
npm install --save foglet-core
```

The foglet library is distributed as a browserified bundle.

## Buliding fog computing applications

[**The foglet cookbook**](https://github.com/RAN3D/foglet-cookbook/) contains tutorials on build complex fog computing application using
`foglet-core`. (**incoming**)

You can also check out [**the documentation online**](https://ran3d.github.io/foglet-core/)

## Getting started

Creates a new HTML file and insert the **foglet bundle** in it:
```html
<script src="node_modules/foglet-core/dist/foglet.bundle.js" type="text/javascript"></script>
```

Then, requires the Foglet library:
```javascript
const Foglet = require("foglet").Foglet
```

If you do not provide a list of **ice servers**, your example will work in localhost but not on the Web.

To be begin with, let's write a simple piece of JS code:
```html
<script type="text/javascript">
  'use strict';
  const Foglet = require('foglet');

  // let's create a simple application that send message in broadcast
  const foglet = new Foglet({
    rps: {
      type: 'spray-wrtc', // we choose Spray as a our RPS
      options: {
        protocol: 'my-awesome-broadcast-application', // the name of the protocol run by our app
        webrtc: { // some WebRTC options
          trickle: true, // enable trickle
          iceServers : [] // define iceServers here if you want to run this code outside localhost
        },
        signaling: { // configure the signaling server
          address: 'http://signaling.herokuapp.com', // put the URL of the signaling server here
          room: 'my-awesome-broadcast-application' // the name of the room for the peers of our application
        }
      }
    }
  });

  // connect the foglet to the signaling server
  foglet.share();

  // Connect the foglet to our network
  foglet.connection().then(() => {
    // listen for broadcast messages
    foglet.onBroadcast((id, message) => {
      console.log('The peer', id, 'just sent me by broadcast:', message);
    });

    // send a message in broadcast
    foglet.sendBroadcast('Hello World !');
  });
</script>
```

Then, open the HTML file and look into the developpers console.
You should see that your foglet has been connected to the RPS.

## Signaling server

In order to run this library, you have to provide the address of a **signaling server** using the `signaling.address` option and a `signaling.room` in order to create a private network. This server will be used to establish the first connection between the new peer and the the network.

This server must be compatible with the foglet library.
The library [foglet-signaling-server](https://github.com/folkvir/foglet-signaling-server) provides an example implementation of such signaling server.

## Contributors:

* [A. Grall (Folkvir)](https://github.com/folkvir) **Author**
* [T. Minier (Callidon)](https://github.com/Callidon)
* [Chat-Wane](https://github.com/Chat-Wane/)

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
