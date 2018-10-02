const assert = require('chai').assert
const Foglet = require('../src/foglet.js')
const utils = require('./utils.js')

describe('Foglet High-level communication', function () {
  this.timeout(20000)

  it('should send messages to a neighbour using unicast', function (done) {
    const foglets = utils.buildFog(Foglet, 2)
    const f1 = foglets[0]
    const f2 = foglets[1]

    f2.onUnicast((id, message) => {
      assert.equal(id, f1.outViewID)
      assert.equal(message, 'hello')
      utils.clearFoglets(foglets).then(() => done())
    })

    utils.pathConnect(foglets, 2000).then(() => {
      setTimeout(function () {
        const peers = f1.getNeighbours()
        console.log(peers)
        assert.equal(peers.length, 1)
        console.log(peers)
        for (let i = 0; i < peers.length; i++) {
          f1.sendUnicast(peers[i], 'hello')
        }
      }, 2000)
    }).catch(done)
  })

  it('should send messages to several neighbours using multicast', function (done) {
    const foglets = utils.buildFog(Foglet, 3)
    const f1 = foglets[0]
    const f2 = foglets[1]
    const f3 = foglets[2]

    let wanted = 0
    let received = 0
    function receive (id, message) {
      received++
      assert.equal(id, f1.outViewID)
      assert.equal(message, 'hello')
      if (received >= wanted) {
        utils.clearFoglets(foglets).then(() => done())
      }
    }

    f2.onUnicast(receive)
    f3.onUnicast(receive)

    utils.pathConnect(foglets, 2000).then(() => {
      setTimeout(() => {
        const peers = f1.getNeighbours()
        wanted = peers.length
        f1.sendMulticast(peers, 'hello')
      }, 2000)
    }).catch(done)
  })

  it('should send messages to all peers using broadcast in a network with 2 peers', function (done) {
    const foglets = utils.buildFog(Foglet, 2)
    let neighbourID = null
    const f1 = foglets[0]
    const f2 = foglets[1]

    f2.onBroadcast((id, data) => {
      assert.equal(id, neighbourID)
      assert.equal(data, 'hello')
      utils.clearFoglets(foglets).then(() => done())
    })

    utils.pathConnect(foglets, 2000).then(() => {
      neighbourID = f1.outViewID
      setTimeout(function () {
        f1.sendBroadcast('hello')
      }, 2000)
    }).catch(done)
  })

  it('should simply send messages to all peers using broadcast in a 3 peers network', function (done) {
    const foglets = utils.buildFog(Foglet, 3)
    const f1 = foglets[0]
    const f2 = foglets[1]
    const f3 = foglets[2]

    let cptA = 0
    let cptB = 0
    const results = [ '1', '2', '3', '4' ]
    const totalResult = 8
    const check = utils.doneAfter(totalResult, () => {
      utils.clearFoglets(foglets).then(() => done())
    })

    utils.pathConnect(foglets, 2000).then(() => {
      f2.onBroadcast((id, message) => {
        assert.equal(id, f1.outViewID)
        assert.equal(message, results[cptA])
        cptA++
        check()
      })

      f3.onBroadcast((id, message) => {
        assert.equal(id, f1.outViewID)
        assert.equal(message, results[cptB])
        cptB++
        check()
      })

      setTimeout(() => {
        f1.sendBroadcast('1')
        f1.sendBroadcast('2')
        f1.sendBroadcast('3')
        f1.sendBroadcast('4')
      }, 2000)
    }).catch(done)
  })

  it('should receive broadcasted classically ordered messages in a 3 peers network (1-2-3-4)', function (done) {
    const foglets = utils.buildFog(Foglet, 3)
    const f1 = foglets[0]
    const f2 = foglets[1]
    const f3 = foglets[2]

    let cptA = 0
    let cptB = 0
    const results = [ '1', '2', '3', '4' ]
    const totalResult = 8
    const check = utils.doneAfter(totalResult, () => {
      utils.clearFoglets(foglets).then(() => done())
    })

    utils.pathConnect(foglets, 2000).then(() => {
      f2.onBroadcast((id, message) => {
        assert.equal(id, f1.outViewID)
        assert.equal(message, results[cptA])
        cptA++
        check()
      })

      f3.onBroadcast((id, message) => {
        assert.equal(id, f1.outViewID)
        assert.equal(message, results[cptB])
        cptB++
        check()
      })

      setTimeout(() => {
        const id1 = f1.overlay().communication.sendBroadcast('1')
        const id2 = f1.overlay().communication.sendBroadcast('2', null, id1)
        const id3 = f1.overlay().communication.sendBroadcast('3', null, id2)
        f1.overlay().communication.sendBroadcast('4', null, id3)
      }, 2000)
    }).catch(done)
  })
  it('should receive broadcasted weirdly ordered messages in a 3 peers network (1-3-2-4)', function (done) {
    const foglets = utils.buildFog(Foglet, 3)
    const f1 = foglets[0]
    const f2 = foglets[1]
    const f3 = foglets[2]

    let cptA = 0
    let cptB = 0
    const results = [ '1', '3', '2', '4' ]
    const totalResult = 8
    const check = utils.doneAfter(totalResult, () => {
      utils.clearFoglets(foglets).then(() => done())
    })

    utils.pathConnect(foglets, 2000).then(() => {
      f2.onBroadcast((id, message) => {
        assert.equal(id, f1.outViewID)
        assert.equal(message, results[cptA])
        cptA++
        check()
      })

      f3.onBroadcast((id, message) => {
        assert.equal(id, f1.outViewID)
        assert.equal(message, results[cptB])
        cptB++
        check()
      })

      setTimeout(() => {
        const id1 = f1.overlay().communication.sendBroadcast('1')
        const id2 = f1.overlay().communication.sendBroadcast('2', null, {e: id1.e, c: 3})
        setTimeout(() => {
          f1.overlay().communication.sendBroadcast('3', null, id1)
          f1.overlay().communication.sendBroadcast('4', null, id2)
        }, 2000)
      }, 2000)
    }).catch(done)
  })
  it('should receive broadcasted weirdly ordered messages in a 3 peers network (1-3-2-4) (second test)', function (done) {
    const foglets = utils.buildFog(Foglet, 3)
    const f1 = foglets[0]
    const f2 = foglets[1]
    const f3 = foglets[2]

    let cptA = 0
    let cptB = 0
    const results = [ '1', '3', '2', '4' ]
    const totalResult = 8
    const check = utils.doneAfter(totalResult, () => {
      utils.clearFoglets(foglets).then(() => done())
    })

    utils.pathConnect(foglets, 2000).then(() => {
      f2.onBroadcast((id, message) => {
        assert.equal(id, f1.outViewID)
        assert.equal(message, results[cptA])
        cptA++
        check()
      })

      f3.onBroadcast((id, message) => {
        assert.equal(id, f1.outViewID)
        assert.equal(message, results[cptB])
        cptB++
        check()
      })

      setTimeout(() => {
        const id1 = f1.overlay().communication.broadcast._causality.increment()
        const id2 = f1.overlay().communication.broadcast._causality.increment()
        const id3 = f1.overlay().communication.sendBroadcast('3', null, id1)
        f1.overlay().communication.sendBroadcast('4', null, id2)
        setTimeout(() => {
          f1.overlay().communication.broadcast._sendAll(f1.overlay().communication.broadcast._createBroadcastMessage('1', id1, null))
          f1.overlay().communication.broadcast._sendAll(f1.overlay().communication.broadcast._createBroadcastMessage('2', id2, id3))
        }, 2000)
      }, 2000)
    }).catch(done)
  })
})
