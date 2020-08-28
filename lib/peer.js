const { v4 } = require('uuid')
module.exports = class Peer {
  constructor (id = v4(), options) {
    this._options = options
    this._nameClass = 'Peer'
    this._id = id
    this._options.set('peer', this)
  }

  /**
   * Return the common options object
   * @return {Options} options
   */
  get options () {
    return this._options
  }

  /**
   * Return the id of the peer
   * @return {string}
   */
  get id () {
    return this._id
  }
}
