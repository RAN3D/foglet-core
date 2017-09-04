'use strict';

localStorage.debug = 'foglet-core:*';

const Foglet = require('foglet').Foglet;

const $ = window.$;
let o = [];
let graphSignaling = [];
const max = 5;
let graph, graphBis, intervalRefresh, intervalRefreshTime = 5000;
function init () {
  o = [];
  for(let i = 0; i < max; ++i) {
    o[i] = new Foglet({
      verbose: true, // want some logs ? switch to false otherwise
      rps: {
        type: 'spray-wrtc',
        options: {
          protocol: 'foglet-example-rps', // foglet running on the protocol foglet-example, defined for spray-wrtc
          webrtc:	{ // add WebRTC options
            trickle: true, // enable trickle (divide offers in multiple small offers sent by pieces)
            iceServers : [] // define iceServers in non local instance
          },
          timeout: 2 * 60 * 1000, // spray-wrtc timeout before definitively close a WebRTC connection.
          delta: 10 * 1000, // spray-wrtc shuffle interval
          signaling: {
            address: 'https://signaling.herokuapp.com/',
            // signalingAdress: 'https://signaling.herokuapp.com/', // address of the signaling server
            room: 'best-room-for-foglet' // room to join
          }
        }
      },
      overlay:{ // overlay options
        enable:true, // want to activate overlay ? switch to false otherwise
        type: [ {class: 'latencies', options: {} } ] // add an latencies overlay
      },
    });
  }

  // Listeners for message
  o.forEach(peer => {
    peer.onUnicast((id, message) => {
      console.log('Receive a unicasted message :', id, message);
    });
  });

  o.forEach(peer => {
    peer.onBroadcast((id, message) => {
      console.log('Receive a broadcasted message: ', message, 'from ', id);
    });
  });
}

const redrawBoth = () => {
  if(intervalRefresh) clearInterval(intervalRefresh);
  intervalRefresh = setInterval(() => {
    if(graph && graphBis) redrawBoth();
  }, intervalRefreshTime);
  redrawMain();
  redrawBis();
};

const redrawMain = () => {
  if(graph) graph.destroy();
  $('#mainGraph').empty();
  $('#mainGraph').append(`<div id='mainGraphBis' style='border: 1px solid black;'></div>`);
  graph = new P2PGraph('#mainGraphBis');
  for(let i = 0; i < o.length; ++i) {
    let id = o[i]._networkManager._rps.network.inviewId
    graph.add({id, me: false, name: id});
  }
  for(let i = 0; i < o.length; ++i) {
    let id = o[i]._networkManager._rps.network.inviewId
    o[i]._networkManager._rps.network.getNeighbours().forEach(peer => {
      // console.log('Main: ', id, 'Neighbor: ', peer);
      graph.connect(peer, id);
    });
  }
};

const redrawBis = () => {
  if(graphBis) graphBis.destroy();
  $('#bisGraph').empty();
  $('#bisGraph').append(`<div id='bisGraphBis' style='border: 1px solid black;'></div>`);
  graphBis = new P2PGraph('#bisGraphBis');

  for(let i = 0; i < o.length; ++i) {
    let id = o[i]._networkManager.use().network.inviewId;
    graphBis.add({id, me: false, name: id});
  }
  for(let i = 0; i < o.length; ++i) {
    let id = o[i]._networkManager.use().network.inviewId;
    o[i]._networkManager.use().network.getNeighbours().forEach(peer => {
      // console.log('Main: ', id, 'Neighbor: ', peer);
      graphBis.connect(peer, id);
    });
  }
};

const directConnection = () => {
  init();
  let f = o[0];
  for(let i = 1; i < max; ++i) {
    let p = o[i];
    f.connection(p).then(d =>{
      if(i === max - 1) {
        redrawBoth();
      }
    });
  }
};

const signalingConnection = (time2wait = 500) => {
  init();
  for (let i = 0; i < max; ++i) {
    (function (ind) {
      setTimeout(function () {
        o[ind].share();
        o[ind].connection().then(d =>{
          if(i === max - 1) {
            redrawBoth();
          }
        });
      }, (time2wait * ind));
    })(i);
  }
};

const message = () => {
  const message = 'UNICAST, Hello world !';
  o.forEach(f => {
    const id = f.getNeighbours();
    if(id.length > 0) {
      id.forEach(i => {
        f.sendUnicast(i, message);
      });
    }
  });
};
const broadcast = () => {
  let f = o[0];
  console.log(f.sendBroadcast('BROADCAST, Hello world ! '));
};
