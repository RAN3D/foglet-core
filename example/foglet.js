'use strict';

localStorage.debug = 'foglet-core:*';

const Foglet = require('foglet').Foglet;

const $ = window.$;
let o = [];
let graphSignaling = [];
const max = 5;

function init () {
  o = [];
  for(let i = 0; i < max; ++i) {
    o[i] = new Foglet({
      protocol: 'foglet-example', // foglet running on the protocol foglet-example, defined for spray-wrtc
      webrtc:	{ // add WebRTC options
        trickle: true, // enable trickle (divide offers in multiple small offers sent by pieces)
        iceServers : [] // define iceServers in non local instance
      },
      timeout: 5 * 60 * 1000, // spray-wrtc timeout before definitively close a WebRTC connection.
      deltatime: 30 * 1000, // spray-wrtc shuffle interval
      signalingAdress: 'https://signaling.herokuapp.com/', // address of the signaling server
      room: 'best-room-for-foglet', // room to join
      verbose: true, // want some logs ? switch to false otherwise
      rpsType: 'spray-wrtc', // type of the rps: spray-wrtc
      overlay:{ // overlay options
        limit: 10, // limit of overlays you can add
        enable:false, // want to activate overlay ? switch to false otherwise
        overlays: [ 'latencies' ] // add an latencies overlay
      }
    });
  }

  // Listeners for message
  o.forEach(peer => {
    peer.onUnicast((id, message) => {
      console.log(id, message);
      logs(`@${peer.options.rps.inviewId} Receive a message from ${id}: `, message);
    });
  });

  o.forEach(peer => {
    peer.onBroadcast((message) => {
      logs(`@${peer.options.rps.inviewId} Receive a broadcast message : `, message);
    });
  });
}

const logs = (...args) => {
  console.log(...args);
  // $('#appendLogs').append('<p>' + string + '</p>');
};

function clearSignalingGraph () {
  $('#graph').empty();
  graphSignaling = [];
  for(let i =0; i<max;++i) {
    $('#graph').append(`<div class='col-md-4' id='graphSignaling${i}' style='border: 1px solid black;'></div>`);
    graphSignaling.push(new P2PGraph('#graphSignaling'+i));
  }
}


const directConnection = (time2wait = 500) => {
  clearSignalingGraph();
  init();
  let f = o[0];
  graphSignaling[0].add({id: f.id, me: true, name: f.id});
  for(let i = 1; i < max; ++i) {
    let p = o[i];
    graphSignaling[i].add({id: p.id, me: true, name: p.id});
    // for a direct connection, need to connect in both way, inview outview...
    f.connection(p).then(d =>{
      logs(`=> Foglet ${f.options.rps.inviewId} has been connected with a direct connection to Foglet ${p.options.rps.inviewId}`);
      drawSignaling();
    });
    p.connection(f).then(d =>{
      logs(`=> Foglet ${p.options.rps.inviewId} has been connected with a direct connection to Foglet ${f.options.rps.inviewId}`);
    });
  }
};

function drawSignaling () {
  let j = 0;
  o.forEach(peer => {
    peer.getNeighbours().forEach(neigh => {
      console.log(neigh);
      if(!graphSignaling[j].hasPeer(neigh)) {
        graphSignaling[j].add({
          id: neigh,
          me: false,
          name: neigh
        });
        graphSignaling[j].connect(peer.id, neigh);
      }
    });//end of peer.getneighbours()...
    j++;
  });// end of o.foreach(...)
}

const signalingConnection = (time2wait = 500) => {
  clearSignalingGraph();
  init();
  for (let i = 0; i < max; ++i) {
    (function (ind) {
      setTimeout(function () {
        o[ind].connection().then(d =>{
          graphSignaling[ind].add({id: o[ind].id, me: true, name: 'Peer: '+ind});
          logs(`=> Foglet number ${ind} has been connected on the room : ${o[ind].options.room}`);
          if(i === max - 1) {
            drawSignaling();
          }
        });
      }, (time2wait * ind));
    })(i);
  }
};

const peers = (k = Infinity) => {
  console.log(k);
  o.forEach(f => {
    logs('@' + f.options.rps.inviewId + ' Peers: ' + f.getNeighbours(k).toString());
  });
};

const message = () => {
  const message = 'UNICAST, Hello world !';
  o.forEach(f => {
    const id = f.getNeighbours();
    logs(`==> @${f.options.rps.inviewId} send a message to ${id}: ` + JSON.stringify(message));
    if(id.length > 0) {
      id.forEach(i => {
        console.log(i);
        f.sendUnicast(message, i);
      });
    }
  });
};
const broadcast = () => {
  let f = o[0];
  logs(`==> @${f.options.rps.inviewId} send a broadcast message: `);
  console.log(f.sendBroadcast('BROADCAST, Hello world ! from '+f.options.rps.inviewId));
};
