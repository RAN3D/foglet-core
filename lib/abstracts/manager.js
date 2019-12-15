const EventEmitter = require('events')

module.exports = class NetworksManager {
  /**
   * Constructor of the network manager
   * @param {object} options the common options object
   */
  constructor (options) {
    this._nameClass = 'NetworksManager'
    this._options = options
    /**
     * when a message has been received,
     * a "data" event will be emitted with (id, data, options) as parameters
     * id is the id of the sender,
     * data is the data received
     * options with the list of options set by the senders
     * @type {EventEmitter}
     */
    this.receive = new EventEmitter()
  }

  get id () {
    return this.options.get('peer').id
  }

  get options () {
    return this._options
  }

  /**
   * Add a new network
   * @param {Network} network the new network to add
   * @param {Network} network the network to set with the name
   */
  addNetwork (network) {
    throw new Error('not yet implemented')
  }

  /**
   * Remove a network given its name
   * @param  {string} key the name of the network to delete
   * @return {Boolean} return true if deleted, false otherwise
   */
  removeNetwork (key) {
    throw new Error('not yet implemented')
  }

  /**
   * Get a network given its name
   * @param  {string} name
   * @return {Network}
   */
  getNetwork (name) {
    throw new Error('not yet implemented')
  }

  /**
   * Return the list of Networks as a Map<name, Network>
   * @return {Map<string,Network>} A map representing networks
   */
  get networks () {
    throw new Error('not yet implemented')
  }

  /**
   * Send data to the specified peer
   * @param  {string} id   the id of the peer to send the data
   * @param  {*} data the data to send
   * @param  {object} options to set when sending the message. Default we have a reply boolean, if set to true the destination must reply before resolving the promise. If timeout has been set then we timeout after the specified number of millisecond before rejecting
   * @return {Promise}  Resolved when the message has been sent, or resolved with the reply if reply has been set to true. Otherwise reject if any error or timeout
   */
  send (id, data, options = {
    reply: false,
    timeout: undefined // undefined or number
  }) {
    throw new Error('not yet implemented')
  }

  /**
   * (called from a Layer)
   * Add a new neighbours to our list of neighbours, if the method is called multiple time, you must call multiple times removeNeighbour in order to delete the physical connection.
   * @param {string} peer the Peer id to add to our list of neighbours
   * @param {Layer} layer the layer that called the method
   * @param {Object} [options={}] options to pass when adding a neighbour
   */
  addPhysicalNeighbourFromLayer (peer, layer, options = {}) {
    throw new Error('not yet implemented')
  }

  /**
   * (called from a network, )
   * @param {string} peer the Peer id to add to our list of neighbours
   * @param {Object} [options={}] options to pass when adding a neighbour
   */
  addPhysicalNeighbourFromNetwork (peer, options = {}) {
    throw new Error('not yet implemented')
  }

  /**
   * Remove a neighbour providing its identifier
   * @param  {string} id
   * @param {Object} [options={}] options to pass when adding a neighbour
   * @return {boolean}
   */
  removePhysicalNeighbour (id, options = {}) {
    throw new Error('not yet implemented')
  }

  addVirtualNeighbour (peer, options) {
    this.view.add(peer, undefined, options)
  }

  removeVirtualNeighbour (peer, options) {
    this.view.add(peer, undefined, options)
  }

  /**
   * Return the list of neighbours
   * @return {Peer[]} the list of neighbours as a list of Peers
   */
  get neighbours () {
    throw new Error('not yet implemented')
  }

  /**
   * Set a Layer
   * Used to create physical connections
   * @param {Layer} layer
   * @return {void}
   */
  setLayer (layer) {
    throw new Error('not yet implemented')
  }

  /**
   * Clear the layer and unset it
   * @return {void}
   */
  unsetLayer () {
    throw new Error('not yet implemented')
  }
}
