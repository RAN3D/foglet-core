'use strict';

localStorage.debug = 'foglet-core:*';

const Foglet = require('foglet').Foglet;

const $ = window.$;
let o = [];
let graph;
let graphSignaling = [];
const max = 5;

function init () {
  o = [];
  for(let i = 0; i < max; ++i) {
    o[i] = new Foglet({
      protocol: 'foglet-example',
      webrtc:	{
        trickle: true,
        iceServers : []
      },
      signalingAdress: 'http://signaling.herokuapp.com/',
      room: 'best-room-for-foglet',
      verbose: true,
      rpsType: 'spray-wrtc',
      overlay:{
        limit: 10,
        enable:false,
        overlays:[]
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

// function clearDirectGraph () {
//   $('#graph').empty();
//   graph = undefined;
//   $('#graph').append("<div id='p2pGraph' style='border: 1px solid black;'>Direct connection graph: <hr/></div>");
//   graph = new P2PGraph('#p2pGraph');
// }

function clearSignalingGraph () {
  $('#graph').empty();
  graphSignaling = [];
  for(let i =0; i<max;++i) {
    $('#graph').append(`<div class='col-md-4' id='graphSignaling${i}' style='border: 1px solid black;'></div>`);
    graphSignaling.push(new P2PGraph('#graphSignaling'+i));
  }
}


// function drawDirect() {
//   let j = 0;
//   o.forEach(peer => {
//     peer.getNeighbours().forEach(neigh => {
//       console.log(neigh);
//       if(!graphSignaling[j].hasPeer(neigh)) {
//         graphSignaling[j].add({
//           id: neigh,
//           me: false,
//           name: neigh
//         });
//         graphSignaling[j].connect(peer.id, neigh);
//       }
//     });//end of peer.getneighbours()...
//     j++;
//   });// end of o.foreach(...)
// }
//
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
      // graphSignaling[i].add({id: .id, me: true, name: o[i].id});
      logs(`=> Foglet ${f.options.rps.inviewId} has been connected with a direct connection to Foglet ${p.options.rps.inviewId}`);
      drawSignaling();
    });
    p.connection(f).then(d =>{
      // graphSignaling[ind].add({id: o[ind].id, me: true, name: 'Peer: '+ind});
      // graph.connect(p.id, f.id);
      // graph.add({
      //   id: 'peer'+i,
      //   me: false,
      //   name: f.id
      // });
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
  // if(graph) {
  //   try {
  //     graph.destroy();
  //   } catch (e) {
  //     graph = undefined;
  //   }
  // }
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
