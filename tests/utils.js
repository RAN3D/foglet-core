/* Testing utilities */
'use strict';
const uuid = require('uuid/v4');

const buildFog = (Foglet, size, overlays = []) => {
  const fog = [];
  // creates a random seed for romm & protocol
  const id = uuid();
  for (let i = 0; i < size; i++)
    fog.push(new Foglet({
      rps: {
        type: 'spray-wrtc',
        options: {
          protocol: `test-protocol-generated-${id}`,
          webrtc:	{ // add WebRTC options
            trickle: true, // enable trickle (divide offers in multiple small offers sent by pieces)
            iceServers : [] // define iceServers in non local instance
          },
          timeout: 30 * 1000, // spray-wrtc timeout before definitively close a WebRTC connection.
          delta: 30 * 1000, // spray-wrtc shuffle interval
          signaling: {
            address: 'http://localhost:3000',
            room: `test-room-generated-${id}`
          }
        }
      },
      overlays
    }));
  return fog;
};

const signalingConnect = (peers) => {
  return Promise.all(peers.map(peer => {
    peer.share();
    return peer.connection();
  }));
};

const clearFoglets = (peers) => {
  return new Promise((resolve, reject) => {
    try{
      resolve(peers.map(p => {
        p._networkManager._rps._network.rps.disconnect();
        p._networkManager._overlays.forEach(overlay => {
          console.log(overlay);
          overlay._network._rps.disconnect();
        });
        return undefined;
      }));
    }catch(e) {
      reject(e);
    }
  });
};

const pathConnect = (peers, timeout, duplex = false) => {
  const pairs = [];
  for(let ind = 0; ind < peers.length - 1; ind++) {
    pairs.push([ peers[ind ], peers[ind + 1] ]);
  }
  return Promise.all(pairs.map(pair => {
    return pair[0].connection(pair[1])
      .then(() => {
        setTimeout(() => {
          if (duplex) {
            return pair[1].connection(pair[0]).then(() => {
              setTimeout(() => {
                return Promise.resolve();
              }, timeout);
            });
          } else {
            return Promise.resolve();
          }
        }, timeout);
      });
  }));
};

const overlayConnect = (index, timeout,  ...peers) => {
  return peers.reduce((prev, peer) => {
    return prev.then(() => {
      peer.share(index);
      return peer.connection(null, index).then((...res) => {
        setTimeout(() => {
          return Promise.resolve(...res);
        }, timeout);
      });
    });
  }, Promise.resolve());
};

const doneAfter = (limit, done) => {
  let cpt = 0;
  return () => {
    cpt++;
    if (cpt >= limit)
      done();
  };
};

module.exports = {
  buildFog,
  pathConnect,
  signalingConnect,
  overlayConnect,
  clearFoglets,
  doneAfter
};
