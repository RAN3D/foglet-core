const Version = require('../package.json').version
const lmerge = require('lodash.merge')
const Errors = require('./errors')
class Core {
  constructor (options) {
    this._options = lmerge({
      version: Version
    }, options)
    this.name = 'core'
    this._networks = new Map()
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
   * @return {Object} return the default network
   */
  default (options) {
    this.addNetwork('spray', require('./plugins/networks').spray, options)
    return this._networks.get('spray')
  }

  /**
   * Create and add a network to the list of networks.
   * This is your responsability to initialize networks' modules.
   * @param {String} name         [description]
   * @param {AbstractNetwork} NetworkClass The network class
   * @param {Object} options      Options to pass to the network
   */
  addNetwork (name, NetworkClass, options) {
    if (this.networks.has(name)) {
      throw Errors.networkAlreadyDefined(name)
    } else {
      const net = new NetworkClass(this, options)
      this.networks.set(name, net)
      return net
    }
  }
}

module.exports = Core
