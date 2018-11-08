const Version = require('../package.json').version
const lmerge = require('lodash.merge')
class Core {
  constructor (options) {
    this._options = lmerge({
      version: Version
    }, options)
    this.name = 'core'
    this._networks = new Map()
    // setting maxlisteners to 50
    // EventEmitter.setMaxListeners(GeneralOptions.general.maxListeners)
    // default configuration
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
   * Get a network by its name
   * @param  {String} name name of the network
   * @return {AbstractNetwork}
   */
  network (name) {
    if (this.networks.has(name)) {
      return this.networks.get(name)
    } else {
      return undefined
    }
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
