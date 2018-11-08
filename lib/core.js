const Version = require('../package.json').version
const lmerge = require('lodash.merge')
class Core {
  constructor (options) {
    this._options = lmerge({
      version: Version
    }, options)
    this.name = 'core'
    this._networks = new Map()
    this._defaultConfiguration = {
      network: require('./plugins/networks').spray
    }
  }
  get options () {
    return this._options
  }
  /**
   * Get all networks in a Map<name:String, Network>
   * @return {Map}
   */
  get networks () {
    return this._networks
  }
  /**
   * Build a default configuration of a Foglet that contains a Spray network with a unicast and stream unicast modules
   * @param {Object} options Options for the network
   * @param {Object} [config=this._defaultConfiguration] the Default configuration
   * @return {Object} return the default network
   */
  default (options, config = this._defaultConfiguration) {
    const network = new config.network(this, options) // eslint-disable-line
    this._networks.set(network.name, network)
    return this._networks.get(network.name)
  }
}

module.exports = Core
