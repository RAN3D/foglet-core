console.log(require('../foglet-core'))
const { Core, Utils } = require('../foglet-core')
const { FullConnected } = require('../foglet-core').Networks
const { LocalLayer } = require('../foglet-core').Layers

const peers = []

function createPeer (id) {
  const peer = new Core(id)
  peer.on('data', (...args) => console.log('[%s] receive: ', peer.id, ...args))
  peer.manager.setLayer(new LocalLayer('local', peer.options))
  peer.manager.addNetwork(new FullConnected('full1', peer.options))
  peer.manager.addNetwork(new FullConnected('full2', peer.options))
  peers.push(peer)
  return peer
}

const max = 50
for (let i = 0; i < max; i++) {
  createPeer('peer:' + i)
}

async function main () {
  return peers.reduce((acc, cur) => acc.then(async () => {
    console.log('connecting: ', cur.id, cur)
    return cur.join()
  }), Promise.resolve())
}

main().then(async () => {
  console.log('connected')
  console.log('waiting for initialization of the network...')
  Utils.countDown(5, 1000).then(() => {
    console.log('help')
    peers.forEach((peer, i) => {
      if (i === max - 1) {
        console.log('Peer: [%s] => ', peer.id, peer.manager.neighbours)
      } else {
        console.log('Peer: [%s] => ', peer.id, peer.manager.neighbours.length)
      }
      // peer.manager.neighbours.forEach(peer => {
      //   console.log(peer)
      // })
      // console.log(peer.manager.networks[0]._lock)
    })
  }).catch((e) => {
    console.error(e)
  })

  // // send a message for networks modules, if not well formatted, it wont work.
  // // try this one with as data: {type: 'full-connected'}
  // await b.manager.send(a.id, 'NETWORK: hello world')
  // // send an application message
  // await b.send(a.id, 'APPLICATION: hello world')

  // return peers.reduce((acc, cur) => acc.then(() => {
  //   console.log('disconnecting: ', cur.id)
  //   return cur.disconnect()
  // }), Promise.resolve()).then(() => {
  //   try {
  //     if (global.gc) {
  //       console.log('Garbage collecting now...')
  //       global.gc(true)
  //     }
  //   } catch (e) {
  //     console.log('`node --expose-gc index.js`')
  //     process.exit()
  //   }
  // })
}).catch(e => {
  console.error(e)
})
