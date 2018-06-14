const assert = require('chai').assert
const FogletAll = require('../foglet-core.js')
const Foglet = FogletAll.Foglet
const TManOverlay = FogletAll.abstract.tman
const Communication = FogletAll.communication

const utils = require('./utils.js')

// Very simple TMan based overlay
class TestOverlay extends TManOverlay {
  constructor (...args) {
    super(...args)
    this.communication = new Communication(this, 'internal-' + this._options.protocol)
  }

  _startDescriptor () {
    return { x: 5 }
  }

  _descriptorTimeout () {
    return 3 * 60 * 1000
  }

  _rankPeers (neighbours, descriptorA, descriptorB) {
    return descriptorA.x <= descriptorB.x
  }
}

describe('Overlays', function () {
  this.timeout(20000)
  it('should build a simple TMan-based overlay', done => {
    const [ f1, f2 ] = utils.buildFog(Foglet, 2, [
      {
        name: 'test-overlay',
        class: TestOverlay,
        options: {
          protocol: 'foglet-test-overlay',
          signaling: {
            room: 'foglet-test-overlay-room',
            address: 'http://localhost:8000/'
          }
        }
      }
    ])

    f1.overlay('test-overlay').communication.onUnicast((id, msg) => {
      assert.equal(msg, 'hello world!')
      console.log('Got message from: ', id, msg)
      done()
    })

    utils.overlayConnect('test-overlay', 2000, f1, f2)
      .then(() => {
        setTimeout(() => {
          const neighbours = f2.overlay('test-overlay').network.getNeighbours()
          assert.equal(neighbours.length, 1)
          f2.overlay('test-overlay').communication.sendUnicast(neighbours[0], 'hello world!')
        }, 2000)
      }).catch(done)
  })

  it('should create a internal communication channel correctly', done => {
    const [ f1, f2 ] = utils.buildFog(Foglet, 2, [
      {
        name: 'test-overlay-communication',
        class: TestOverlay,
        options: {
          protocol: 'foglet-test-overlay-communication',
          signaling: {
            address: 'http://localhost:8000/',
            room: 'foglet-test-overlay-communication-room'
          }
        }
      }
    ])

    f1.overlay('test-overlay-communication').network.communication.onUnicast((id, msg) => {
      assert.equal(msg, 'hello world!')
      console.log('Got message from: ', id, msg)
      done()
    })

    utils.overlayConnect('test-overlay-communication', 2000, f1, f2)
      .then(() => {
        setTimeout(() => {
          const neighbours = f2.overlay('test-overlay-communication').network.getNeighbours()
          assert.equal(neighbours.length, 1)
          f2.overlay('test-overlay-communication').network.communication.sendUnicast(neighbours[0], 'hello world!')
        }, 2000)
      }).catch(done)
  })
})
