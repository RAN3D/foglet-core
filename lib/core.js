const Options = require('./abstracts/options')
const Peer = require('./abstracts/peer')
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
    return this.manager.connect()
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
