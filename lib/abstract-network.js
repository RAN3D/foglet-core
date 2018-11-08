const Errors = require('./errors')
class AbstractNetwork {
  constructor (foglet, options) {
    this._foglet = foglet
    this._options = options
    this._modules = new Map()
  }
  default (options) {
    const unicast = new (require('./plugins').modules.unicast)(this.foglet, this, options) // eslint-disable-line
    this.addModule(unicast.name, unicast)
    return this
  }
  /**
   * Return the main foglet instance, the Core
   * @return {Core}
   */
  get foglet () {
    return this._foglet
  }
  /**
   * Return options of this network
   * @return {Object}
   */
  get options () {
    return this._options
  }
  /**
   * Return the map containing all modules
   * @return {Map} Map containing all modules for this network.
   */
  get modules () {
    return this._modules
  }
  /**
   * Attached a module to this network
   * @param {Module} module Module to attach
   */
  addModule (name, module) {
    if (this.modules.has(name)) {
      throw Errors.moduleAlreadyDefined(module.name)
    } else {
      this.modules.set(name, module)
    }
  }
}

module.exports = AbstractNetwork
