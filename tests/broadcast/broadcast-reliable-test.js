const Core = require('../../lib/').core
const StdBroadcast = require('../../lib/plugins/modules/std-broadcast')
const Assert = require('assert')

describe('broadcast', function () {
  this.timeout(60000)
  it('5-peers network, fifo broadcast module', () => {
    return new Promise((resolve, reject) => {
      let peers = []
      let max = 5
      let rec = 0
      let h1 = false
      let h2 = false
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
        const broadcast = network.addModule('broadcast-reliable', StdBroadcast, { protocol: 'stdbroadcast-reliable' }).reliable
        broadcast.on('receive', (id, message) => {
          console.log('receive from %s:', id, message)
          Assert.strictEqual(id, peers[0].network.id)
          if (message === 'hello world 1') h1 = true
          if (message === 'hello world 2') h2 = true
          rec++
          if (rec === 2 * (max - 1) && h1 && h2) {
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
