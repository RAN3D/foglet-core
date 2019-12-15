console.log(require('../foglet-core'))
const { Core } = require('../foglet-core')
const { FullConnected } = require('../foglet-core').Networks
const { LocalLayer } = require('../foglet-core').Layers

const peers = []

function createPeer (id) {
  const peer = new Core(id)
  peer.on('data', (...args) => console.log('[%s] receive: ', peer.id, ...args))
  peer.manager.setLayer(new LocalLayer('local', peer.options))
  peer.manager.addNetwork(new FullConnected('full', peer.options))
  peers.push(peer)
  return peer
}

const max = 20
for (let i = 0; i < max; i++) {
  createPeer('peer:' + i)
}

async function main () {
  return peers.reduce((acc, cur) => acc.then(() => {
    return cur.join()
  }), Promise.resolve())
}

main().then(async () => {
  console.log('connected')
  peers.forEach((peer, i) => {
    if (i === max - 1) {
      console.log('Peer: [%s] => ', peer.id, peer.manager.neighbours)
    } else {
      console.log('Peer: [%s] => ', peer.id, peer.manager.neighbours.length)
    }
  })
  // // send a message for networks modules, if not well formatted, it wont work.
  // // try this one with as data: {type: 'full-connected'}
  // await b.manager.send(a.id, 'NETWORK: hello world')
  // // send an application message
  // await b.send(a.id, 'APPLICATION: hello world')
}).catch(e => {
  console.error(e)
})
