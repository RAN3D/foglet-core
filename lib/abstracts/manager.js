const View = require('../view')

module.exports = class NetworksManager {
  /**
   * Constructor of the network manager
   * @param {object} options the common options object
   */
  constructor (options) {
    this._nameClass = 'NetworksManager'
    this._options = options
    /**
     * An internal view storing all connections and networks bindings
     * @type {View}
     */
    this._view = new View(this.options, this.options.get('view'))
  }

  /**
   * Return the identifier of the peer
   * @return {string}
   */
  get id () {
    return this.options.get('peer').id
  }

  /**
   * Return the internal view of the manager
   * @return {View}
   */
  get view () {
    return this._view
  }

  /**
   * Return the global options object of the core
   * @return {Options}
   */
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
   * @param  {*} options
   * @return {Promise}  Resolved when the message has been sent otherwise reject with an error
   */
  send (id, data, options = {}) {
    throw new Error('not yet implemented')
  }

  /**
   * Called uppon reception of a message from the layer
   * @param  {string} id
   * @param  {*} data
   * @param  {*} options
   * @return {void}
   */
  receive (id, data, options) {
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
  removePhysicalNeighbourFromLayer (id, options = {}) {
    throw new Error('not yet implemented')
  }

  /**
   * Add an occurence to the existing connection.
   * @param {string} peer
   * @param {*} options
   * @return {void}
   */
  addVirtualNeighbour (peer, options) {
    throw new Error('not yet implemented')
  }

  /**
   * Remove an occurence from an existing connection
   * @param  {string} peer
   * @param  {*} options
   * @return {void}
   */
  removeVirtualNeighbour (peer, options) {
    throw new Error('not yet implemented')
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
