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
        iceServers: [] // define iceServers in non local instance
      },
      origins: '*'
    }, options))

    // make a unique id of this network
    this.id = this._rps.PEER
  }

  /**
   * Build a Spray RPS
   * @param {Object} options - Options used to build the RPS
   * @return {Spray} The Spray network
   */
  _buildRPS (options) {
    // if webrtc options specified: create object config for Spray
    const sprayOptions = lmerge({config: options.webrtc}, options)
    return new Cyclon(sprayOptions)
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
   * Get the IDs of all available neighbours
   * @param  {integer} limit - Max number of neighbours to look for
   * @return {string[]} Set of IDs for all available neighbours
   */
  getNeighbours (limit) {
    // BUG, sometimes our id is in our partial view.
    // Tempory fix by removing this element if in results
    return this._rps.getPeers(limit)
    // lremove(result, (elem) => {
    //   return elem === this.inviewId;
    // })
    // return result;
  }
}

module.exports = CyclonAdapter
