const EventEmitter = require('events')

module.exports = class Network {
  constructor (name, options) {
    this._options = options
    this._nameClass = 'Network'
    this._name = name
    this._options.set(name, this)
    this._manager = this._options.get('manager')
    this._receive = new EventEmitter()
  }

  get name () {
    return this._name
  }

  /**
   * Return the common options object
   * @return {Options} options
   */
  get options () {
    return this._options
  }

  get manager () {
    return this._manager
  }

  /**
   * Called by the manager when a message has been received
   * It will emit an event data on the _receive event bus.
   * @param  {string} id identifier of the peer who sent the message
   * @param  {*} data any data sent
   * @param  {*} options any options passed
   * @return {void}
   */
  receive (id, data, options) {
    this._receive.emit('data', id, data, options)
  }
}
