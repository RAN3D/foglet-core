const test = require('ava')
const { Core } = require('../../foglet-core')
const { FullConnected } = require('../../foglet-core').Networks
const { LocalLayer } = require('../../foglet-core').Layers

test('(full-connected) all peers should have 99 neighbours on both networks', t => {
  const peers = []
  const protocol = 'protocol-test'
  function createPeer (id) {
    const peer = new Core(id)
    peer.on('data', (...args) => console.log('[%s] receive: ', peer.id, ...args))
    peer.manager.setLayer(new LocalLayer('local', peer.options))
    peer.manager.addNetwork(new FullConnected(protocol, peer.options))
    // peer.manager.addNetwork(new FullConnected('full2', peer.options))
    peers.push(peer)
    return peer
  }

  const max = 3
  for (let i = 0; i < max; i++) {
    createPeer('peer:' + i)
  }

  async function main () {
    return peers.reduce((acc, cur, index) => acc.then(async () => {
      return cur.join()
    }), Promise.resolve())
  }

  return main().then(async () => {
    return new Promise((resolve, reject) => {
      peers.forEach(peer => {
        t.assert(peer.manager.view.size() === max - 1)
        peer.manager.view.view.forEach((networkNames) => {
          t.deepEqual(networkNames[protocol], max - 1)
        })
      })
      resolve()
    })
  }).catch(e => {
    console.error(e)
    throw e
  })
})
