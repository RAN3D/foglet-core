const test = require('ava')
const { Core } = require('../../foglet-core')
const { FullConnected } = require('../../foglet-core').Networks
const { LocalLayer } = require('../../foglet-core').Layers

test('(full-connected) should be connected correctly in a bidirectional for 2 peers', t => {
  const peers = []
  const protocol = 'protocol-test'
  function createPeer (id) {
    const peer = new Core(id)
    peer.on('data', (...args) => console.log('[%s] receive: ', peer.id, ...args))
    peer.manager.setLayer(new LocalLayer('local', peer.options))
    peer.manager.addNetwork(new FullConnected(protocol, peer.options))
    peers.push(peer)
    return peer
  }

  const max = 2
  for (let i = 0; i < max; i++) {
    createPeer('peer:' + i)
  }

  async function main () {
    await peers[0].join()
    await peers[1].join()
  }

  return main().then(async () => {
    peers.forEach(peer => {
      peer.manager.view.view.forEach((obj, id) => {
        t.assert(obj[protocol] === 1)
        t.assert(peer.manager.view.size() === 1)
        t.assert(peer.manager.view.has(peer.manager.networks[0], (peer.id === peers[0].id ? 'peer:1' : 'peer:0')))
      })
    })
  }).catch(e => {
    console.error(e)
    throw e
  })
})
