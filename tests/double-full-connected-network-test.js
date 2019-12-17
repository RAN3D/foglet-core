import test from 'ava'
const { Core } = require('../foglet-core')
const { FullConnected } = require('../foglet-core').Networks
const { LocalLayer } = require('../foglet-core').Layers

test('(full-connected x2) all peers should have 99 neighbours on both networks', t => {
  const peers = []

  function createPeer (id) {
    const peer = new Core(id)
    peer.on('data', (...args) => console.log('[%s] receive: ', peer.id, ...args))
    peer.manager.setLayer(new LocalLayer('local', peer.options))
    peer.manager.addNetwork(new FullConnected('full1', peer.options))
    // peer.manager.addNetwork(new FullConnected('full2', peer.options))
    peers.push(peer)
    return peer
  }

  const max = 4
  for (let i = 0; i < max; i++) {
    createPeer('peer:' + i)
  }

  async function main () {
    return peers.reduce((acc, cur) => acc.then(async () => {
      console.log('connecting: ', cur.id)
      return cur.join()
    }), Promise.resolve())
  }

  return main().then(async () => {
    return new Promise((resolve, reject) => {
      peers.forEach(peer => {
        console.log('%s', peer.id, peer.manager.view.get())
        t.assert(peer.manager.view.get().length === max - 1)
        peer.manager.view.get().forEach(entry => {
          t.assert(entry[1].length === 1)
          t.assert(entry[1].includes('full1')) // && entry[1].includes('full2'))
        })
      })
      resolve()
    })
  }).catch(e => {
    console.error(e)
    throw e
  })
})
