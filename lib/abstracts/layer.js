const EventEmitter = require('events')

module.exports = class Layer {
  constructor (name, options) {
    this._options = options
    this._nameClass = 'Layer'
    this._name = name
    this._options.set(name, this)
    this._receive = new EventEmitter()
  }

  get manager () {
    return this._options.get('manager')
  }

  /**
   * Return our identifier
   * @return {string}
   */
  get id () {
    return this._options.get('peer').id
  }

  /**
   * Return the name
   * @return {*} the name of this layer
   */
  get name () {
    return this._name
  }

  /**
   * Create a physical connection between us and the destination peer id
   * @param  {string}  id
   * @param  {Object}  [options={}] any options
   * @return {Promise} a Promise resolved when the connection has been successfully established
   */
  async connect (id, options = {}) {
    throw new Error('not yet implemented')
  }

  /**
   * Disconnect a physical connection
   * @param  {string}  id [description]
   * @return {Promise}    [description]
   */
  async disconnect (id) {
    throw new Error('not yet implemented')
  }

  /**
   * Send a message to the specified peer
   * @param  {string}  id
   * @param  {*}  data
   * @param  {Object}  [options={}]
   * @return {Promise}
   */
  async send (id, data, options = {}) {
    throw new Error('not yet implemented')
  }

  /**
   * need to be called when we receive a message from someone
   * @param  {string}  id
   * @param  {*}  data
   * @param  {*}  options
   * @return {Promise}
   */
  async _receiveCallback (id, data, options) {
    this._receive.emit('data', id, data, options, (data, options) => this.send(id, data, options))
  }
}
