module.exports = class AbstractModule {
  constructor (foglet, network, options) {
    this._foglet = foglet
    this._network = network
    this._options = options
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
   * Return the parent network
   * @return {AbstractNetwork} Parent Network
   */
  get network () {
    return this._network
  }
}
