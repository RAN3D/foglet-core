/*
MIT License

Copyright (c) 2016-2017 Grall Arnaud

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
'use strict'

const AbstractNetwork = require('./abstract-network.js')
const TMan = require('tman-wrtc')
const lmerge = require('lodash.merge')

/**
 * A TManOverlay is an abstract network used to build overlay based on the TMan network over WebRTC.
 * @see https://github.com/RAN3D/tman-wrtc for more informations on TMan.
 * @abstract
 * @extends AbstractOverlay
 * @author Thomas Minier
 */
class TManOverlay extends AbstractNetwork {
  /**
   * Constructor
   * @param {Object} options - Additional options used to build the network
   * @return {NetworkManager} networkManager - Network manager used as root for the overlay
   */
  constructor (networkManager, options) {
    options.manager = networkManager
    super(options)
    this._manager = networkManager
    this._rps.parent.once('open', () => {
      console.log('SON connected')
      this._rps._start()
    })
  }

  /**
   * The in-view ID of the peer in the network
   * @return {string} The in-view ID of the peer
   */
  get inviewId () {
    return this.rps.getInviewId()
  }

  /**
   * The out-view ID of the peer in the network
   * @return {string} The out-view ID of the peer
   */
  get outviewId () {
    return this.rps.getOutviewId()
  }

  /**
   * Get our current descriptor
   * @return {Object} The peer current descriptor
   */
  get descriptor () {
    return this._rps.options.descriptor
  }

  /**
   * Update the peer descriptor
   * @param  {Object} newDescriptor - The new descriptor
   * @return {void}
   */
  set descriptor (newDescriptor) {
    this._rps.options.descriptor = newDescriptor
  }

  /**
   * Build a TMan network
   * @param {Object} options - Options used to build the TMan
   * @return {TMan} The TMan network
   */
  _buildRPS (options) {
    // if webrtc options specified: create object config for Spray
    this.options = lmerge({config: options.webrtc}, options)
    const tmanOptions = lmerge({
      descriptor: this._startDescriptor(),
      descriptorTimeout: this._descriptorTimeout(),
      ranking: this._rankingFunction()
    }, this.options)
    return new TMan(tmanOptions, options.manager._rps._network._rps)
  }

  /**
   * Gives the start descriptor used by the TMan overlay (can be an empty object).
   * Subclasses of {@link TManOverlay} **must** implement this method.
   * @return {Object} The start descriptor used by the TMan overlay
   */
  _startDescriptor () {
    throw new Error('A valid TMan based overlay must implement a _descriptor method to generate a base descriptor')
  }

  /**
   * Give the delay **in milliseconds** after which the descriptor must be recomputed.
   * Subclasses of {@link TManOverlay} **must** implement this method.
   * @return {number} The delay **in milliseconds** after which the descriptor must be recomputed
   */
  _descriptorTimeout () {
    throw new Error('A valid TMan based overlay must implement a _descriptorTimeout method to give the timeout on descriptors')
  }

  /**
   * Compare two peers and rank them according to a ranking function.
   * This function must return `0 if peerA == peerB`, `1 if peerA < peerB` and `-1 if peerA > peerB`.
   *
   * Subclasses of {@link TManOverlay} **must** implement this method.
   * @param {*} neighbour - The neighbour to rank with
   * @param {Object} descriptorA - Descriptor of the first peer
   * @param {Object} descriptorB - Descriptor of the second peer
   * @param {TManOverlay} peerA - (optional) The overlay of the first peer
   * @param {TManOverlay} peerB - (optional) The overlay of the second peer
   * @return {integer} `0 if peerA == peerB`, `1 if peerA < peerB` and `-1 if peerA > peerB` (according to the ranking algorithm)
   */
  _rankPeers (neighbour, descriptorA, descriptorB, peerA, peerB) {
    throw new Error('A valid TMan based overlay must implement a _rankPeers method to rank two peers' + `variable: ${neighbour.toString()}${descriptorA.toString()}${descriptorB.toString()}${peerA.toString()}${peerB.toString()}`)
  }

  /**
   * Utility to rank two peers
   * @private
   */
  _rankingFunction () {
    return peer => (a, b) => this._rankPeers(peer, a.descriptor, b.descriptor, a, b)
  }

  /**
   * Get the IDs of all available neighbours
   * @param  {integer} limit - Max number of neighbours to look for
   * @return {string[]} Set of IDs for all available neighbours
   */
  getNeighbours (limit) {
    return this.rps.getPeers(limit)
  }
}

module.exports = TManOverlay
