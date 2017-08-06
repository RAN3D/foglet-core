'use strict';

const Foglet = require('../src/foglet.js');
const AbstractOverlay = require('../src/network/abstract/abstract-overlay.js');
const Spray = require('spray-wrtc');
const lmerge = require('lodash/merge');
const utils = require('./utils.js');

// This simple overlay is a basic spray adapter
class TestOverlay extends AbstractOverlay {
  constructor (options) {
    super(lmerge({
      webrtc:	{
        trickle: true,
        iceServers : []
      },
      origins:'*',
    }, options));
  }

  _buildRPS (options) {
    const sprayOptions = lmerge({config: options.webrtc}, options);
    return new Spray(sprayOptions);
  }

  get inviewId () {
    return this._rps.getInviewId();
  }

  get outviewId () {
    return this._rps.getOutviewId();
  }

  getNeighbours (limit) {
    return this.rps.getPeers(limit);
  }
}

describe('Overlays', () => {
  it('should build an overlay', done => {
    const [ f1, f2 ] = utils.buildFog(Foglet, 2, [
      {
        class: TestOverlay,
        options: {
          signaling: {
            address: 'http://localhost:3000',
            room: 'test-room-overlay'
          }
        }
      }
    ]);

    f1.getNetwork(1).communication.onUnicast((id, msg) => {
      assert.equal(msg, 'hello world!');
      done();
    });

    utils.overlayConnect(1, f1, f2)
    .then(() => {
      setTimeout(() => {
        const neighbours = f2.getNetwork(1).network.getNeighbours();
        assert.equal(neighbours.length, 1);
        f2.getNetwork(1).communication.sendUnicast(neighbours[0], 'hello world!');
      }, 2000);
    }).catch(done);
  });
});
