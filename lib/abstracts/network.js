const Lock = require('../lock')

module.exports = class Network {
  constructor (name, options) {
    this._options = options
    this._nameClass = 'Network'
    this._name = name
    this._manager = this._options.get('manager')
    this.options.events.networks.on(this._name, (id, data, options) => this.receive(id, data, options))
    this._view = []
    this._lock = new Lock(this.id)
    this._options.set(name, this)
    this._initialized = false
  }

  /**
   * Return true or false if the network has been initilized or not
   * @return {Boolean}
   */
  get initialized () {
    return this._initialized
  }

  /**
   * Return the local view of the network
   * @return {Array}
   */
  get view () {
    return this._view
  }

  /**
   * Return the identifier of the peer responsible for the network
   * @return {string}
   */
  get id () {
    return this.options.get('peer').id
  }

  /**
   * Return the identifier of the network
   * @return {string}
   */
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

  /**
   * Return the manager of this network. (is also the manager of other networks)
   * @return {Manager}
   */
  get manager () {
    return this._manager
  }

  /**
   * Called by the manager when a message has been received for this network
   * It will emit an event data on the _receive event bus.
   * @param  {string} id identifier of the peer who sent the message
   * @param  {*} data any data sent
   * @param  {*} options any options passed
   * @return {void}
   */
  receive (id, data, options) {
    throw new Error('not yet implemented')
  }

  /**
   * Send a message only for this network
   * @param  {string}  id
   * @param  {*}  data
   * @param  {*}  options
   * @return {Promise}
   */
  async send (id, data, options) {
    return this.manager.send(id, {
      type: this.name,
      data
    }, options)
  }

  /**
   * Clear the actual view
   * @return {void}
   */
  clear () {
    this._view = []
  }
}
