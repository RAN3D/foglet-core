'use strict';

const Foglet = require('../src/foglet.js');
const TManOverlay = require('../src/network/abstract/tman-overlay.js');
const utils = require('./utils.js');

// This simple overlay is a basic spray adapter
class TestOverlay extends TManOverlay {
  _startDescriptor () {
    return { x: 5 };
  }

  _descriptorTimeout () {
    return 3 * 60 * 1000;
  }

  _rankPeers (neighbours, descriptorA, descriptorB) {
    return descriptorA.x <= descriptorB.x;
  }
}

describe('Overlays', () => {
  it('should build an overlay', done => {
    const [ f1, f2 ] = utils.buildFog(Foglet, 2, [
      {
        name: 'test-overlay',
        class: TestOverlay,
        options: {
          protocol: 'foglet-test-overlay',
          signaling: {
            address: 'http://localhost:3000',
            room: 'foglet-test-overlay-room'
          }
        }
      }
    ]);

    f1.overlay('test-overlay').communication.onUnicast((id, msg) => {
      assert.equal(msg, 'hello world!');
      done();
    });

    utils.overlayConnect('test-overlay', f1, f2)
    .then(() => {
      setTimeout(() => {
        const neighbours = f2.overlay('test-overlay').network.getNeighbours();
        assert.equal(neighbours.length, 1);
        f2.overlay('test-overlay').communication.sendUnicast(neighbours[0], 'hello world!');
      }, 2000);
    }).catch(done);
  });
});
