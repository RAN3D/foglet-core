/* eslint no-async-promise-executor: off */
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
    return Promise.all(peers.map(peer => (async () => {
      const values = [...peer.manager.view.view]
      t.assert(values.length === 1)
      for (let i = 0; i < values.length; ++i) {
        const id = values[i][0]
        const protocols = values[i][1]
        t.assert(protocols[protocol] === 1)
        t.deepEqual(id, (peer.id === 'peer:0' ? 'peer:1' : 'peer:0'))
        // get the view by locking it
        const { lock, view } = await peer.manager.networks[0].getView()
        t.assert(lock !== undefined)
        t.deepEqual(view.length, 1, 'the view should have one peer')
        // unlock the view without modification
        await peer.manager.networks[0].mergeView(lock)
      }
    })()))
  }).catch(e => {
    console.error(e)
    throw e
  })
})
