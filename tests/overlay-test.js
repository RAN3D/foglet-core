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
      webrtc:	{ // add WebRTC options
        trickle: true, // enable trickle (divide offers in multiple small offers sent by pieces)
        iceServers : [] // define iceServers in non local instance
      },
      origins:'*',
    }, options));
  }

  _buildRPS (options) {
    // if webrtc options specified: create object config for Spray
    const sprayOptions = lmerge({config: options.webrtc}, options);
    return new Spray(sprayOptions);
  }

  getNeighbours (limit) {
    return this.rps.getPeers(limit);
  }
}

describe('Overlays', () => {
  it('should build an overlay', done => {
    const [ f1, f2, f3 ] = utils.buildFog(Foglet, 3, [
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

    utils.overlayConnect(1, f1, f2, f3)
    .then(() => {
      assert.isAbove(f1.getNetwork(1).network.getNeighbours().length, 0);
      assert.isAbove(f2.getNetwork(1).network.getNeighbours().length, 0);
      assert.isAbove(f3.getNetwork(1).network.getNeighbours().length, 0);
      done();
    }).catch(done);
  });
});
