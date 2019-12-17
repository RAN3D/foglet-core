module.exports = class Layer {
  constructor (name, options) {
    this._options = options
    this._nameClass = 'Layer'
    this._name = name
    this._options.set(name, this)
  }

  /**
   * Return the common options object
   * @return {*}
   */
  get options () {
    return this._options
  }

  /**
   * Return the manager responsible of this layer
   * @return {Manager}
   */
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
   * Return true if the connection exsists
   * @param  {string}  id identifier of the peer we want to check the connection
   * @return {Boolean}
   */
  has (id) {
    throw new Error('not yet implemented')
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
   * @return {Promise} resolve when successful, otherwise throw an error
   */
  async send (id, data) {
    throw new Error('not yet implemented')
  }

  /**
   * need to be called when we receive a message from someone
   * @param  {string}  id
   * @param  {*}  data
   * @return {Promise}
   */
  async _receiveCallback (id, data) {
    this.options.events.layer.emit('data', id, data)
  }
}
