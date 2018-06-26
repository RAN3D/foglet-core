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
'use strict'

const AbstractNetwork = require('./../abstract/abstract-network.js')
// const lremove = require('lodash/remove');
const Spray = require('spray-wrtc')
const lmerge = require('lodash.merge')

/**
 * SprayAdapter adapts the usage of a Spray RPS in the foglet library.
 * @see https://github.com/RAN3D/spray-wrtc for more details about Spray
 * @extends AbstractNetwork
 * @author Grall Arnaud (Folkvir)
 */
class SprayAdapter extends AbstractNetwork {
  constructor (options) {
    super(lmerge({
      webrtc: { // add WebRTC options
        trickle: true, // enable trickle (divide offers in multiple small offers sent by pieces)
        config: {iceServers: []} // define iceServers in non local instance
      },
      origins: '*'
    }, options))
  }

  /**
   * Build a Spray RPS
   * @param {Object} options - Options used to build the RPS
   * @return {Spray} The Spray network
   */
  _buildRPS (options) {
    // if webrtc options specified: create object config for Spray
    const sprayOptions = lmerge({config: options.webrtc}, options)
    return new Spray(sprayOptions)
  }

  /**
   * The in-view ID of the peer in the network
   * @return {string} The in-view ID of the peer
   */
  get inviewId () {
    return this._rps.getInviewId()
  }

  /**
   * The out-view ID of the peer in the network
   * @return {string} The out-view ID of the peer
   */
  get outviewId () {
    return this._rps.getOutviewId()
  }

  /**
   * Get the IDs of all available neighbours with or without their suffix -I or -O
   * @param  {Boolean} transform - transform IDs into reachable ids to used for send messages => (peer) => peer-O
   * @return {String[]} Set of IDs for all available neighbours
   */
  getReachableNeighbours (transform = true) {
    return this._rps.uniqNeighbours(transform)
  }

  /**
   * Get the IDs of all available neighbours with or without their suffix -I or -O
   * @param  {Integer} limit - Max number of neighbours to look for
   * @return {String[]} Set of IDs for all available neighbours
   */
  getNeighbours (limit = undefined) {
    return this._rps.getPeers(limit)
  }

  /**
   * Get the IDs of all available neighbours
   * @return {String[]} Set of IDs for all available neighbours
   */
  getArcs () {
    const arcs = this._rps.neighbours()
    const i = arcs.inview.map(entry => entry.peer)
    const o = arcs.inview.map(entry => entry.peer)
    return i.concat(o)
  }
}

module.exports = SprayAdapter
