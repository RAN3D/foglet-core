/* Testing utilities */
'use strict'
const uuid = require('uuid/v4')
const SimplePeerMoc = require('./../src/utils/simple-peer-moc')

const buildFog = (Foglet, size, overlays = [], ice = []) => {
  const fog = []
  // creates a random seed for romm & protocol
  const id = uuid()
  for (let i = 0; i < size; i++) {
    const options = {
      rps: {
        type: 'spray-wrtc',
        options: {
          protocol: `test-protocol-generated-${id}`,
          webrtc: { // add WebRTC options
            trickle: true, // enable trickle (divide offers in multiple small offers sent by pieces)
            iceServers: ice // define iceServers in non local instance
          },
          timeout: 30 * 1000, // spray-wrtc timeout before definitively close a WebRTC connection.
          delta: 30 * 1000, // spray-wrtc shuffle interval
          socketClass: SimplePeerMoc,
          signaling: {
            address: 'http://localhost:8000/',
            room: `test-room-generated-${id}`,
            origins: '*:*'
          }
        }
      },
      overlays
    }
    options.overlays.forEach(overlay => {
      overlay.options.socketClass = SimplePeerMoc
    })
    fog.push(new Foglet())
  }
  return fog
}

const signalingConnect = (peers) => {
  return Promise.all(peers.map(peer => {
    peer.share()
    return peer.connection()
  })).then(() => {
    return Promise.resolve()
  }).catch(e => {
    return Promise.reject(e)
  })
}

const clearFoglets = (peers) => {
  return new Promise((resolve, reject) => {
    try {
      resolve(peers.map(p => {
        p._networkManager._rps._network.rps.disconnect()
        p._networkManager._overlays.forEach(overlay => {
          console.log(overlay)
          overlay._network._rps.disconnect()
        })
        return undefined
      }))
    } catch (e) {
      reject(e)
    }
  })
}

const pathConnect = (peers, timeout, duplex = false) => {
  const pairs = []
  for (let ind = 0; ind < peers.length - 1; ind++) {
    pairs.push([ peers[ ind ], peers[ ind + 1 ] ])
  }
  return Promise.all(pairs.map(pair => {
    return pair[0].connection(pair[1])
      .then(() => {
        setTimeout(() => {
          if (duplex) {
            return pair[1].connection(pair[0]).then(() => {
              setTimeout(() => {
                return Promise.resolve()
              }, timeout)
            })
          } else {
            return Promise.resolve()
          }
        }, timeout)
      })
  }))
}

const overlayConnect = (index, timeout, ...peers) => {
  return peers.reduce((prev, peer) => {
    return prev.then(() => {
      peer.share(index)
      return peer.connection(null, index).then((...res) => {
        setTimeout(() => {
          return Promise.resolve(...res)
        }, timeout)
      })
    })
  }, Promise.resolve())
}

const doneAfter = (limit, done) => {
  let cpt = 0
  return () => {
    cpt++
    if (cpt >= limit) { done() }
  }
}

module.exports = {
  buildFog,
  pathConnect,
  signalingConnect,
  overlayConnect,
  clearFoglets,
  doneAfter
}
