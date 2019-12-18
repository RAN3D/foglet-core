import test from 'ava'
const { LocalLayer } = require('../../foglet-core').Layers
const { Options, Peer } = require('../../foglet-core')
test('(LocalLayer) connect', async t => {
  function createLayer (id) {
    const options = Options()
    const peer = new Peer(id, options)
    return new LocalLayer('local', options)
  }
  const a = createLayer('A')
  const b = createLayer('B')
  const c = createLayer('C')

  const peer = await a.connect()
  t.assert(peer === undefined)
  const peer2 = await b.connect()
  t.assert(peer2 === 'A')
  const peer3 = await c.connect()
  t.assert([a.id, b.id].includes(peer3))
})
