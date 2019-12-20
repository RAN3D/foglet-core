/* eslint no-unused-vars: off */
import test from 'ava'
const { LocalLayer } = require('../../foglet-core').Layers
const { Options, Peer } = require('../../foglet-core')

function createLayer (id, protocol) {
  const options = Options()
  const peer = new Peer(id, options)
  return new LocalLayer(protocol, options)
}

test('(LocalLayer) with id set and options.by, A => B => C, A to C by B', async t => {
  const protocol = 'test-2'
  // first create C
  const c = createLayer('C', protocol)
  const peer = await c.join()
  t.assert(peer === undefined)

  // B to C
  const b = createLayer('B', protocol)
  const peer2 = await b.join(undefined, { by: 'C' })
  t.assert(peer2 === 'C')
  t.assert(b.has('C'))

  // A to B
  const a = createLayer('A', protocol)
  const peer3 = await a.join(undefined, { by: 'B' })
  t.assert(peer3 === 'B')
  t.assert(a.has('B'))

  // connect now A to C through B
  // B may have C in its view, then connect it if it's true
  const peer4 = await a.join('C', { by: 'B' })
  t.assert(peer4 === 'C')
})
