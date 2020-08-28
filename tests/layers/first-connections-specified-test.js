/* eslint no-unused-vars: off */
const test = require('ava')
const { LocalLayer } = require('../../foglet-core').Layers
const { Options, Peer } = require('../../foglet-core')

function createLayer (id, protocol) {
  const options = Options()
  const peer = new Peer(id, options)
  return new LocalLayer(protocol, options)
}

test('(LocalLayer) with id undefined, connect to the options.by', async t => {
  const protocol = 'test-1'
  const a = createLayer('A', protocol)
  const peer = await a.connect()
  t.assert(peer === undefined)

  const b = createLayer('B', protocol)
  const peer2 = await b.connect(undefined, { by: 'A' })
  t.assert(peer2 === 'A')
  t.assert(b.has('A'))

  const c = createLayer('C', protocol)
  const peer3 = await c.connect(undefined, { by: 'B' })
  t.assert(peer3 === 'B')
  t.assert(c.has('B'))
})
