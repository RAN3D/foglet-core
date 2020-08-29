/* eslint no-async-promise-executor: off */
const test = require('ava')
const { Core } = require('../../foglet-core')
const { FullConnected } = require('../../foglet-core').Networks
const { LocalLayer } = require('../../foglet-core').Layers

const max = 20
test(`(full-connected) all peers should have ${max - 1} neighbours on both networks`, t => {
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

  for (let i = 0; i < max; i++) {
    createPeer('peer:' + i)
  }

  async function main () {
    return peers.reduce((acc, cur, index) => acc.then(async () => {
      return cur.join()
    }), Promise.resolve())
  }

  return main().then(async () => {
    return Promise.all(peers.map(peer => (async () => {
      const values = [...peer.manager.view.view]
      // console.log('[%s] View: ', peer.id, values)
      t.deepEqual(values.length, max - 1, `should have max-1=${max - 1} peers in our view`)
      for (let i = 0; i < values.length; ++i) {
        // const id = values[i][0]
        const protocols = values[i][1]
        t.deepEqual(protocols[protocol], 1, 'should have 1 on each protocol')
        // get the view by locking it
        const { lock, view } = await peer.manager.networks[0].getView()
        t.assert(lock !== undefined)
        t.deepEqual(view.length, max - 1, 'the view should have one peer')
        // unlock the view without modification
        await peer.manager.networks[0].mergeView(lock)
      }
    })()))
  }).catch(e => {
    console.error(e)
    throw e
  })
})
