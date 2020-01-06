/* eslint no-unused-vars: off */
import test from 'ava'
const { LocalLayer } = require('../../foglet-core').Layers
const { Options, Peer } = require('../../foglet-core')

function createLayer (id, protocol) {
  const options = Options()
  const peer = new Peer(id, options)
  return new LocalLayer(protocol, options)
}

test('(LocalLayer) A => B then B to A', async t => {
  const protocol = 'test-2'
  // first create B
  const b = createLayer('B', protocol)
  const peer = await b.connect()
  t.assert(peer === undefined)

  // A to B
  const a = createLayer('A', protocol)
  const peer2 = await a.connect(undefined, { by: 'B' })
  t.assert(peer2 === 'B')
  t.assert(a.has('B'))

  // then B to A initiated by A
  return new Promise((resolve, reject) => {
    const resolved = [false, false]
    b.options.events.layer.on('add:physical', (peer) => {
      resolved[0] = true
      if (resolved.reduce((a, b) => a && b, true)) {
        resolve()
      }
    })
    a.connect('B', { by: 'B' }).then((p) => {
      t.assert(p === undefined)
      t.assert(b.has('A'))
      resolved[1] = true
      if (resolved.reduce((a, b) => a && b, true)) {
        resolve()
      }
    })
  })
})
