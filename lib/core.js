const Options = require('./abstracts/options')
const Peer = require('./abstracts/peer')
const Manager = require('./manager')
const debug = require('debug')('foglet-core:core')
module.exports = class Core {
  constructor (id, options = undefined) {
    this._nameClass = 'Core'
    if (!options) {
      this._options = Options(this)
    } else {
      this._options = options
    }
    this._manager = new Manager(this.options)
    this._peer = new Peer(id, this.options)
    debug('Core initialized.')
  }

  get id () {
    return this._peer.id
  }

  /**
   * Return the common options object used in foglet-core
   * @return {*}
   */
  get options () {
    return this._options
  }

  get manager () {
    return this._manager
  }
}
