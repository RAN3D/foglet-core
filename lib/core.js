const Options = require('./options')
const Peer = require('./peer')
const Manager = require('./manager')
const EventEmitter = require('events')
module.exports = class Core extends EventEmitter {
  constructor (id, options = undefined) {
    super()
    this._nameClass = 'Core'
    if (!options) {
      this._options = Options()
    } else {
      this._options = options
    }
    this._manager = new Manager(this.options)
    this._peer = new Peer(id, this.options)
    this._options.set('core', this)
  }

  /**
   * Connect the module!
   * @return {Promise}
   */
  async join () {
    return this.manager.join()
  }

  /**
   * Disconnect the peer completely from the network
   * Aka, it signals to all network protocols to clear everything and purge useless data.
   * It signals to the layer to clear every active connections and purge useless data.
   * The manager also clear its internal view.
   * @return {Promise} [description]
   */
  async disconnect () {
    return this.manager.disconnect()
  }

  /**
   * Send an application message
   * @param  {string} id identifier of the peer to send the message
   * @param  {*} data any data to send to
   * @return {Promise}
   */
  send (id, data, options) {
    return this.manager.send(id, {
      type: 'application',
      data
    }, options)
  }

  /**
   * Uppon reception of a message emit the event 'data' with as parameters
   * (id, data, options)
   * @param  {string} id
   * @param  {*} data
   * @param  {*} options
   */
  receive (id, data, options) {
    this.emit('data', id, data, options)
  }

  /**
   * Return the identifier of this peer
   * @return {string}
   */
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

  /**
   * Return the manager responsible for managing connections
   * @return {Manager}
   */
  get manager () {
    return this._manager
  }
}
