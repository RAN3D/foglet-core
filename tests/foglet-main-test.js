const assert = require('chai').assert
const Foglet = require('../src/foglet.js')
const utils = require('./utils.js')

describe('[FOGLET] Other functions tests', function () {
  this.timeout(20000)
  it('[FOGLET] getRandomNeighbourId is in getNeighbours', function (done) {
    const foglets = utils.buildFog(Foglet, 2)
    const f1 = foglets[0]
    const f2 = foglets[1]

    utils.pathConnect(foglets, 2000).then(() => {
      console.log('Peers: ', f1.getNeighbours(), f2.getNeighbours())
      console.log('Random:', f1.getRandomNeighbourId(), f2.getRandomNeighbourId())
      assert.include(f1.getNeighbours(), f1.getRandomNeighbourId())
      utils.clearFoglets(foglets).then(() => done())
    }).catch(done)
  })
})
