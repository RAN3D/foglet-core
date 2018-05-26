/* eslint no-unused-vars: 0 */
const assert = require('chai').assert
const Foglet = require('../src/foglet.js')
const defineProtocol = require('../src/fprotocol/protocol-builder.js')
const utils = require('./utils.js')

function initProtocol (callback, done) {
  this._callback = callback
  this._done = done
}

const UnicastProtocol = defineProtocol('sample-unicast-protocol')`
  init
  ${initProtocol}
  get
  ${function (service) {
    service.is.unicast()
    service.on.receive(function (id, msg, reply, reject) {
      if (this._callback) this._callback(id, msg, reply, reject)
      if (this._done) this._done()
    })
  }}
`

const BroadcastProtocol = defineProtocol('sample-broadcast-protocol')`
  init
  ${initProtocol}
  get
  ${function (service) {
    service.is.broadcast()
    service.on.receive(function (id, msg) {
      if (this._callback) this._callback(id, msg)
      if (this._done) this._done()
    })
  }}
`

describe('FogletProtocol', function () {
  this.timeout(20000)
  describe('#unicast', () => {
    describe('#communication', () => {
      it('should receive messages from remote services', done => {
        const foglets = utils.buildFog(Foglet, 2)
        const f1 = foglets[0]
        const f2 = foglets[1]
        const expected = 'Hello world!'
        const p1 = new UnicastProtocol(f1)
        const p2 = new UnicastProtocol(f2, (id, msg) => {
          assert.equal(msg, expected)
        }, () => {
          utils.clearFoglets(foglets).then(() => done())
        })

        utils.pathConnect(foglets, 2000, true).then(() => {
          const peers = f1.getNeighbours()
          assert.equal(peers.length, 1)
          setTimeout(function () {
            p1.get(peers[0], expected)
          }, 1000)
        })
      })

      it('should allow peers to reply to service calls', done => {
        const foglets = utils.buildFog(Foglet, 2)
        const f1 = foglets[0]
        const f2 = foglets[1]
        const p1 = new UnicastProtocol(f1)
        const p2 = new UnicastProtocol(f2, (id, msg, reply) => {
          reply(msg + ' world!')
        })

        utils.pathConnect(foglets, 2000, true).then(() => {
          const peers = f1.getNeighbours()
          assert.equal(peers.length, 1)
          setTimeout(function () {
            p1.get(peers[0], 'Hello')
              .then(msg => {
                assert.equal(msg, 'Hello world!')
                utils.clearFoglets(foglets).then(() => done())
              })
              .catch(() => {
                utils.clearFoglets(foglets).then(() => done())
              })
          }, 1000)
        })
      })

      it('should allow peers to reject service calls', done => {
        const foglets = utils.buildFog(Foglet, 2)
        const f1 = foglets[0]
        const f2 = foglets[1]
        const p1 = new UnicastProtocol(f1)
        const p2 = new UnicastProtocol(f2, (id, msg, reply, reject) => {
          reject(msg + ' world!')
        })

        utils.pathConnect(foglets, 2000, true).then(() => {
          const peers = f1.getNeighbours()
          assert.equal(peers.length, 1)
          setTimeout(function () {
            p1.get(peers[0], 'Hello')
              .then(msg => {
                utils.clearFoglets(foglets).then(() => done(new Error('Message should have rejected but instead got reply with ' + msg)))
              })
              .catch(msg => {
                assert.equal(msg, 'Hello world!')
                utils.clearFoglets(foglets).then(() => done())
              })
          }, 1000)
        })
      })
    })

    describe('#hooks', () => {
      let UnicastHookProtocol
      it('should allow before hooks on send & receive', done => {
        UnicastHookProtocol = defineProtocol('unicast-protocol-with-hooks')`
          init
          ${initProtocol}
          get
          ${function (service) {
    service.is.unicast()
    service.on.receive(function (id, msg) {
      if (this._callback) this._callback(id, msg)
      if (this._done) this._done()
    })
    service.before.send(function (msg) {
      return msg + ' and Thanks for'
    })
    service.before.receive(function (msg) {
      return msg + ' all the Fish'
    })
  }}
        `

        const foglets = utils.buildFog(Foglet, 2)
        const f1 = foglets[0]
        const f2 = foglets[1]
        const p1 = new UnicastHookProtocol(f1)
        const p2 = new UnicastHookProtocol(f2, (id, msg) => {
          assert.equal(msg, 'So Long and Thanks for all the Fish')
        }, () => {
          utils.clearFoglets(foglets).then(() => done())
        })

        utils.pathConnect(foglets, 2000, true).then(() => {
          const peers = f1.getNeighbours()
          assert.equal(peers.length, 1)
          setTimeout(function () {
            p1.get(peers[0], 'So Long')
          }, 1000)
        })
      })

      it('should allow after hooks on send & receive', done => {
        const check = utils.doneAfter(2, () => {
          utils.clearFoglets(foglets).then(() => done())
        })
        UnicastHookProtocol = defineProtocol('unicast-protocol-with-hooks')`
          get
          ${function (service) {
    service.is.unicast()
    service.on.receive(function () {})
    service.after.send(function (msg) {
      assert.equal(msg, 'So Long')
      check()
    })
    service.after.receive(function (msg) {
      assert.equal(msg, 'So Long')
      check()
    })
  }}
        `

        const foglets = utils.buildFog(Foglet, 2)
        const f1 = foglets[0]
        const f2 = foglets[1]
        const p1 = new UnicastHookProtocol(f1)
        const p2 = new UnicastHookProtocol(f2)

        utils.pathConnect(foglets, 2000, true).then(() => {
          const peers = f1.getNeighbours()
          assert.equal(peers.length, 1)
          setTimeout(function () {
            p1.get(peers[0], 'So Long')
          }, 1000)
        })
      })
    })
  })

  describe('#broadcast', () => {
    describe('#communication', () => {
      it('should receive messages from remote services', done => {
        const foglets = utils.buildFog(Foglet, 2)
        const f1 = foglets[0]
        const f2 = foglets[1]
        const expected = 'Hello world!'
        const p1 = new BroadcastProtocol(f1)
        const p2 = new BroadcastProtocol(f2, (id, msg) => {
          assert.equal(msg, expected)
        }, () => {
          utils.clearFoglets(foglets).then(() => done())
        })

        utils.pathConnect(foglets, 2000).then(() => {
          setTimeout(function () {
            p1.get(expected)
          }, 1000)
        })
      })
    })

    describe('#hooks', () => {
      let BroadcastHookProtocol
      it('should allow before hooks on send & receive', done => {
        BroadcastHookProtocol = defineProtocol('broadcast-protocol-with-hooks')`
          init
          ${initProtocol}
          get
          ${function (service) {
    service.is.broadcast()
    service.on.receive(function (id, msg) {
      if (this._callback) this._callback(id, msg)
      if (this._done) this._done()
    })
    service.before.send(function (msg) {
      return msg + ' and Thanks for'
    })
    service.before.receive(function (msg) {
      return msg + ' all the Fish'
    })
  }}
        `

        const foglets = utils.buildFog(Foglet, 2)
        const f1 = foglets[0]
        const f2 = foglets[1]
        const p1 = new BroadcastHookProtocol(f1)
        const p2 = new BroadcastHookProtocol(f2, (id, msg) => {
          assert.equal(msg, 'So Long and Thanks for all the Fish')
        }, () => {
          utils.clearFoglets(foglets).then(() => done())
        })

        utils.pathConnect(foglets, 2000, true).then(() => {
          const peers = f1.getNeighbours()
          assert.equal(peers.length, 1)
          setTimeout(function () {
            p1.get('So Long')
          }, 1000)
        })
      })

      it('should allow after hooks on send & receive', done => {
        const check = utils.doneAfter(2, () => {
          utils.clearFoglets(foglets).then(() => done())
        })
        BroadcastHookProtocol = defineProtocol('broadcast-protocol-with-hooks')`
          get
          ${function (service) {
    service.is.broadcast()
    service.on.receive(function () {})
    service.after.send(function (msg) {
      assert.equal(msg, 'So Long')
      check()
    })
    service.after.receive(function (msg) {
      assert.equal(msg, 'So Long')
      check()
    })
  }}
        `

        const foglets = utils.buildFog(Foglet, 2)
        const f1 = foglets[0]
        const f2 = foglets[1]
        const p1 = new BroadcastHookProtocol(f1)
        const p2 = new BroadcastHookProtocol(f2)

        utils.pathConnect(foglets, 2000, true).then(() => {
          const peers = f1.getNeighbours()
          assert.equal(peers.length, 1)
          setTimeout(function () {
            p1.get('So Long')
          }, 1000)
        })
      })
    })
  })
})
