<div style='text-align:center'>
<img src="https://octodex.github.com/images/socialite.jpg" width="200" style='text-align:center'><img src="https://octodex.github.com/images/collabocats.jpg" width="200" style='text-align:center'><img src="https://octodex.github.com/images/socialite.jpg" width="200" style='text-align:center'>
<hr/>
</div>

# [![Build Status](https://travis-ci.org/RAN3D/foglet-core.svg?branch=master)](https://travis-ci.org/RAN3D/foglet-core) [![npm version](https://badge.fury.io/js/foglet-core.svg)](https://badge.fury.io/js/foglet-core) [![NPM](https://nodei.co/npm/foglet-core.png)](https://npmjs.org/package/foglet-core)
 [![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

Easy use of WebRTC Networks with embedded network management and simple communication primitives.

Communication primitives:
- Causal Broadcast (to all peers in your network, with anti entropy not enabled by default)
- Unicast (to one direct neighbor)
- Multicast (to one or several direct neighbors)
- Streaming over our Causal Broadcast and Unicast
- Multiple communication channel per network

We only support Data Channel for the moment.

Network management:
- An adapter on [ran3d/spray-wrtc](https://github.com/ran3d/spray-wrtc) as Random Peer Sampling Network (keeping log(NetworkSize) peers around you)
- An adapter on [Cyclon](https://www.semanticscholar.org/paper/CYCLON%3A-Inexpensive-Membership-Management-for-P2P-Voulgaris-Gavidia/4b79c844bb854c11ab18981591e4d2ea01f29539) as Random Peer Sampling Network (keeping "maxPeers" peers around you)
- Overlay Networks or Networks can be created with: [**ran3d/n2n-overlay-wrtc**](https://github.com/ran3d/n2n-overlay-wrtc)

## Installation

**Prerequisite**: [a browser compatible with WebRTC](http://caniuse.com/#feat=rtcpeerconnection)

```bash
npm install --save foglet-core
```

The foglet library is distributed with its sources and a bundle for an in-browser usage.

## Buliding fog computing applications

[**The foglet cookbook**](https://github.com/RAN3D/foglet-cookbook/) contains tutorials on build complex fog computing application using
`foglet-core`. (**incoming**)

You can also check out [**the documentation online**](https://ran3d.github.io/foglet-core/)

## Getting started

Creates a new HTML file and insert the **foglet bundle** in it:
```html
<script src="node_modules/foglet-core/dist/foglet.bundle.js" type="text/javascript"></script> <!-- or use the minified bundle, foglet.bundle.min.js -->
```

Then, foglet library is available in the variable `foglet` :
```javascript
const FogletClass = foglet.Foglet;
```

If you do not provide a list of **ice servers**, your example will work in localhost but not on the Web.

To be begin with, let's write a simple piece of JS code:
```html
<script type="text/javascript">
  'use strict';

  localStorage.debug = 'foglet-core:*';

  const Foglet = foglet.Foglet;

  // let's create a simple application that send message in broadcast
  const fog = new Foglet({
    id: 'myfogletid', // default we use uuid/v4 generated id
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
  fog.share();

  // Connect the foglet to our network
  fog.connection().then(() => {
    // listen for broadcast messages
    fog.onBroadcast((id, message) => {
      console.log('The peer', id, 'just sent me by broadcast:', message);
    });

    // send a message in broadcast
    fog.sendBroadcast('Hello World !');
  });
</script>
```

Then, open the HTML file and look into the developpers console.
You should see that your foglet has been connected to the RPS.

Or for the fast version:
```bash
git clone https://github.com/RAN3D/foglet-core.git
cd foglet-core
npm install
npm run build
```

* Open tests/examples/example.html in a browser supporting WebRTC and the devConsole

* Try to play with `testunicast()` and `testbroadcast()`

or try the signaling example using a signaling server:
* Just run a simple http server with an embedded signaling server serving the tests/examples/example-signaling.html: `npm run example`
* open http://localhost:8000/signaling

## Signaling server

In order to run this library, you have to provide the address of a **signaling server** using the `signaling.address` option and a `signaling.room` in order to create a private network. This server will be used to establish the first connection between the new peer and the the network.

This server must be compatible with the foglet library.
The library [foglet-signaling-server](https://github.com/folkvir/foglet-signaling-server) provides an example implementation of such signaling server.

## Developpment

We offer another library which lets you to build/test/run your own application with a signaling server: https://github.com/ran3d/foglet-scripts.git

```bash
# Clone and install
git clone https://github.com/ran3d/foglet-core.git
npm install

# Build the bundle with foglet-scripts (webpack/karma/babel stack)
npm run build

# Lint using [standard](https://standardjs.com/)
npm run lint

# Lint and Test the lib with foglet-scripts (webpack/karma/babel/standard stack)
npm run test

# Run the signaling server
npm run server
```

## Contributors:

* [A. Grall (Folkvir)](https://github.com/folkvir) **Author**
* [T. Minier (Callidon)](https://github.com/Callidon)
* [B. Nédelec (Chat-Wane)](https://github.com/Chat-Wane/)

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
