const assert = require('chai').assert
const Foglet = require('../src/foglet.js')
const utils = require('./utils.js')

const simpleMiddleware = {
  in: msg => msg + ' and Thanks for',
  out: msg => msg + ' all the Fish'
}

describe('Middlewares', function () {
  this.timeout(20000)
  it('should use middleware on broadcast', function (done) {
    const foglets = utils.buildFog(Foglet, 2)
    const f1 = foglets[0]
    const f2 = foglets[1]

    f1.use(simpleMiddleware)
    f2.use(simpleMiddleware)

    f2.onBroadcast((id, data) => {
      assert.equal(data, 'So Long and Thanks for all the Fish')
      utils.clearFoglets(foglets).then(() => done())
    })

    utils.pathConnect(foglets, 2000).then(() => {
      setTimeout(function () {
        f1.sendBroadcast('So Long')
      }, 2000)
    })
  })

  it('should use middleware on unicast', function (done) {
    const foglets = utils.buildFog(Foglet, 2)
    const f1 = foglets[0]
    const f2 = foglets[1]

    f1.use(simpleMiddleware)
    f2.use(simpleMiddleware)

    f2.onUnicast((id, message) => {
      assert.equal(message, 'So Long and Thanks for all the Fish')
      utils.clearFoglets(foglets).then(() => done())
    })

    utils.pathConnect(foglets, 2000).then(() => {
      setTimeout(function () {
        const peers = f1.getNeighbours()
        assert.equal(peers.length, 1)
        f1.sendUnicast(peers[0], 'So Long')
      }, 2000)
    })
  })
})
