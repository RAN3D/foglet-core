const assert = require('assert')
const Core = require('../lib/').core
describe('Using the signaling service', function () {
  this.timeout(5000)
  it('2-peers network, signaling connection and unicast module', async () => {
    const core1 = new Core()
    const core2 = new Core()
    const s1 = core1.default({
      n2n: {
        id: 's1'
      },
      signaling: {
        room: 'test',
        host: 'http://localhost',
        port: 5000
      },
      socket: {
        moc: true
      }
    }).default() // construct a spray network and add a unicast module based on events
    const s2 = core2.default({
      n2n: {
        id: 's2'
      },
      signaling: {
        room: 'test',
        host: 'http://localhost',
        port: 5000
      },
      socket: {
        moc: true
      }
    }).default() // construct a spray network and add a unicast module based on events
    await s2.connect()
    await s1.connect()
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
})
