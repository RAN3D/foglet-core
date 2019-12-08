const Core = require('../../lib/').core
const StdBroadcast = require('../../lib/plugins/modules/std-broadcast')
const Assert = require('assert')

describe('broadcast', function () {
  this.timeout(60000)
  it('2-peers network, fifo broadcast module', async () => {
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
      const s1Broadcast = s1.addModule('broadcast', StdBroadcast, { protocol: 'stdbroadcast' }).fifo
      const s2Broadcast = s2.addModule('broadcast', StdBroadcast, { protocol: 'stdbroadcast' }).fifo
      s2Broadcast.on('receive', (id, message) => {
        console.log('receive a message from s1', id, message)
        Assert.strictEqual(s1Broadcast._buffer.length, 0)
        Assert.strictEqual(s2Broadcast._buffer.length, 0)
        resolve()
      })
      s1Broadcast.send('hello world').then((notsent) => {
        console.log('Message sent, not sent:', notsent)
      }).catch(e => {
        console.error(e)
      })
    })
  })

  it('5-peers network, fifo broadcast module', () => {
    return new Promise((resolve, reject) => {
      let peers = []
      let max = 5
      let rec = 0
      let rec1 = []
      let rec2 = []
      let timeout
      for (let i = 0; i < max; i++) {
        const c = new Core()
        const network = c.default({
          n2n: {
            id: 's' + i
          },
          socket: {
            moc: true
          }
        }).default()
        const broadcast = network.addModule('broadcast', StdBroadcast, { protocol: 'stdbroadcast' }).fifo
        broadcast.on('receive', (id, message) => {
          console.log('receive from %s:', id, message)
          if (message === 'hello world 1') {
            rec1.push(id)
          } else if (message === 'hello world 2') {
            rec2.push(id)
          }
          if (rec2.indexOf(id) >= 0 && rec1.indexOf(id) < 0 && rec1.length !== 0) reject(new Error('"hello world 1" need to be delivered before "hello world 2"'))
          Assert.strictEqual(id, peers[0].network.id)
          rec++
          if (rec === 2 * (max - 1)) {
            clearTimeout(timeout)
            console.log('all peer receive the message')
            resolve()
          }
        })
        peers[i] = {
          network,
          broadcast
        }
      }
      let connected = []
      console.log(peers[0].network.connect)
      peers[0].network.connect(peers[1].network).then(() => {
        connected.push(peers[0], peers[1])
        return peers.reduce((acc, peer, ind) => acc.then(() => {
          return new Promise((resolve, reject) => {
            if (ind > 1) {
              const rn = Math.floor(Math.random() * connected.length)
              const rnpeer = connected[rn]
              peer.network.connect(rnpeer.network).then(() => {
                connected.push(peer)
                console.log('peer %s is conencted to %s', peer.network.id, rnpeer.network.id)
                resolve()
              }).catch(e => {
                reject(e)
              })
            } else {
              resolve()
            }
          })
        }), Promise.resolve()).then(() => {
          timeout = setTimeout(() => {
            reject(new Error('need to receive all messages in less than 5 seconds. perhaps there is an error'))
          }, 5000)

          const msg1 = peers[0].broadcast._create('hello world 1')
          const msg2 = peers[0].broadcast._create('hello world 2')
          peers[0].broadcast._propagate(msg2)
          setTimeout(() => {
            peers[0].broadcast._propagate(msg1)
          }, 1000)
        })
      }).catch(e => {
        reject(e)
      })
    })// endpromise
  })// end test 20-peers
})
