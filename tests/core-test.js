const assert = require('assert')
const Core = require('../lib/').core
describe('Core', function () {
  this.timeout(5000)
  it('return the version of the package.json', () => {
    const core = new Core()
    assert.strictEqual(core.options.version, require('../package.json').version)
  })
  it('Core default function create a default configuration', () => {
    const core = new Core()
    const s1 = core.default({
      n2n: {
        id: 's1'
      },
      socket: {
        moc: true
      }
    }) // construct a spray network by default
    s1.default() // add a unicast module based on events
    assert.strictEqual(s1.name, 'spray-wrtc')
    assert.strictEqual(s1.modules.has('unicast'), true)
    const s1Unicast = s1.modules.get('unicast')
    assert.strictEqual(s1Unicast.name, 'unicast')
    assert.strictEqual(s1Unicast.foglet.name, 'core')
    assert.strictEqual(s1Unicast.network.name, 'spray-wrtc')
  })
  it('2-peers network, unicast module', async () => {
    const core1 = new Core()
    const s1 = core1.default({
      n2n: {
        id: 's1'
      },
      socket: {
        moc: true
      }
    }).default() // construct a spray network and add a unicast module based on events
    const core2 = new Core()
    const s2 = core2.default({
      n2n: {
        id: 's2'
      },
      socket: {
        moc: true
      }
    }).default() // construct a spray network and add a unicast module based on events
    await s1.connect(s2)
    return new Promise((resolve, reject) => {
      const s1unicast = s1.module('unicast')
      const s2unicast = s2.module('unicast')
      s1unicast.on('test', (id, message) => {
        assert.strictEqual(id, 's2')
        console.log('S1 receive the message from %s: ', id, message)
        s1.disconnect().then(() => {
          s2.disconnect().then(() => {
            resolve()
          })
        })
      })
      s2unicast.on('test', (id, message) => {
        assert.strictEqual(id, 's1')
        console.log('S2 receive the message from %s: ', id, message)
        s2unicast.send('test', id, message)
      })
      s1unicast.send('test', s2.id, 'meow')
    })
  })
  it('2-peers network, getNeighbours function', async () => {
    const core1 = new Core()
    const s1 = core1.default({
      n2n: {
        id: 's1'
      },
      socket: {
        moc: true
      }
    }).default() // construct a spray network and add a unicast module based on events
    const core2 = new Core()
    const s2 = core2.default({
      n2n: {
        id: 's2'
      },
      socket: {
        moc: true
      }
    }).default() // construct a spray network and add a unicast module based on events
    await s1.connect(s2)
    // at least
    assert.strictEqual(s1.getNeighbours().outview.length, 1)
  })
})
