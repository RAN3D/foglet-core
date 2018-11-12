const Errors = require('./errors')
const EventEmitter = require('events')
const lmerge = require('lodash.merge')

class AbstractNetwork extends EventEmitter {
  constructor (foglet, options) {
    super()
    this._foglet = foglet
    this._options = options
    this._modules = new Map()
  }
  /**
   * Id of the peer
   * @return {String} identifier of this peer
   */
  get id () {
    throw Errors.notYetImplemented('You need to provide an id in order to identify this peer.')
  }

  default (options) {
    this.addModule('unicast', require('./plugins').modules.unicast, lmerge({ protocol: 'unicast' }, options))
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
   * Get a network by its name
   * @param  {String} name name of the network
   * @return {AbstractNetwork}
   */
  module (name) {
    if (this.modules.has(name)) {
      return this.modules.get(name)
    } else {
      return undefined
    }
  }
  /**
   * Attached a module to this network
   * @param {Module} module Module to attach
   */
  addModule (name, Module, options) {
    const mod = new Module(this._foglet, this, options)
    if (this.modules.has(name)) {
      throw Errors.moduleAlreadyDefined(name)
    } else {
      this.modules.set(name, mod)
    }
  }

  /**
   * Connect the peer to a network using direct or signaling exchange of offers. see (n2n-wrtc)
   * @param  {AbstractNetwork|undefined} instance Another instance or undefined
   * @return {Promise}
   */
  connect (instance) {
    throw Errors.notYetImplemented('connect method not yet implemented.')
  }
  /**
   * Disconnect the peer from the network
   * @param  {peerId|undefined} peerId if peerId, disconnect only the connection attached to this peer. Or disconnect all connections.
   * @return {Promise}
   */
  disconnect (peerId) {
    throw Errors.notYetImplemented('disconnect method not yet implemented.')
  }
  /**
   * Send a message to a peer identified by its id
   * @param  {String} id       identifier of the peer to send the message to
   * @param  {Object} message  the message to send
   * @return {Promise} A promise resolved when the message is sent, rejected otherwise
   */
  send (id, message) {
    throw Errors.notYetImplemented('send method not yet implemented.')
  }

  /**
   * When a message is received emit the message on the event receive with the id of the sender and the message
   * @param  {String} id      Identifier of the sender
   * @param  {Object} message The message received
   * @return {void}
   */
  receive (id, message) {
    this.emit('receive', id, message)
  }

  /**
   * Return a list of neighbours' ids in our outview and inview
   * @example
   * f.getNeighbours() // {outview: ['a', 'b'], inview: ['c']}
   * @return {Object} {outview: [<string>...], inview: [<string>...]}
   */
  getNeighbours () {
    throw Errors.notYetImplemented('getNeighbours method not yet implemented.')
  }
}

module.exports = AbstractNetwork
