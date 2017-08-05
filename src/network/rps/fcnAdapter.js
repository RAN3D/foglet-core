/*
MIT License

Copyright (c) 2016 Grall Arnaud

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the 'Software'), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
'use strict';

const lmerge = require('lodash/merge');
const Fcn = require('fcn-wrtc').Fcn;
const AbstractNetwork = require('./../abstract/abstract-network.js');

/**
 * fcnAdapter adapts the usage of a Fully connected network over WebRTC in the foglet library.
 * @see https://github.com/RAN3D/fcn-wrtc for more details about this type of network
 * @extends AbstractNetwork
 * @author Grall Arnaud (Folkvir)
 */
class fcnAdapter extends AbstractNetwork {
  constructor (options) {
    super(lmerge({
      webrtc: {
        trickle: true,
        iceServers: []
      }
    }, options));
  }

  /**
   * Build a Fully connected network.
   * @param {Object} options - Options used to build the RPS
   */
  _buildRPS (options) {
    // if webrtc options specified: create object config for Spray
    const opts = lmerge({config: options.webrtc}, options);
    return new Fcn(opts);
  }

  /**
   * The in-view ID of the peer in the network
   * @return {string} The in-view ID of the peer
   */
  get inviewId () {
    return this._rps.getInviewId();
  }

  /**
   * The out-view ID of the peer in the network
   * @return {string} The out-view ID of the peer
   */
  get outviewId () {
    return this._rps.getOutviewId();
  }

  /**
   * Get the IDs of all available neighbours
   * @param  {integer} limit - Max number of neighbours to look for
   * @return {string[]} Set of IDs for all available neighbours
   */
  getNeighbours (k = undefined) {
    return this._rps.getPeers(k).o;
  }

}

module.exports = fcnAdapter;
