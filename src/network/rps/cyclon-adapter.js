const AbstractNetwork = require('./../abstract/abstract-network')
// const lremove = require('lodash/remove');
const Cyclon = require('./cyclon/cyclon')
const lmerge = require('lodash.merge')

/**
 * CyclonAdapter adapts the usage of a Cyclon RPS in the foglet library.
 * @extends AbstractNetwork
 * @author Grall Arnaud (Folkvir)
 */
class CyclonAdapter extends AbstractNetwork {
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
    const cyclonOptions = lmerge({config: options.webrtc}, options)
    return new Cyclon(cyclonOptions)
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

module.exports = CyclonAdapter
