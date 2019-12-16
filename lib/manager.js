const NetworksManager = require('./abstracts/manager')
const Utils = require('./utils')
const debug = require('debug')('foglet-core:manager')
const uuid = require('uuid/v4')

module.exports = class Manager extends NetworksManager {
  constructor (options) {
    super(options)
    this._nameClass = 'Manager'
    this._layer = null
    this._networks = new Map()
    this.options.set('manager', this)
  }

  /**
   * Connect the peer using the specified layer to the specified peer if any.
   * Or initiate the first connection
   * @param  {string|undefined}  [id=undefined] perr identifier or undefined
   * @param  {Object}  [options={}]
   * @return {Promise}
   */
  async connect (id = undefined, options = {}) {
    if (!id) {
      // first connection
      const peer = await this._layer.connect(id, options)
      // wait for all networks to be initialized, listen on initialized event from every network
      if (peer) {
        await Utils.asyncWhile(() => {
          const networks = [...this._networks.values()]
          const init = networks.map(e => e.initialized)
          const reduce = init.reduce((a, b) => a && b, true)
          return reduce
        })
      }
    } else {
      debug('connecting:', id, options)
      return this._layer.connect(id, options)
    }
  }

  /**
   * Disconnect the peer from the network using the specified layer.
   * Also clear internal data (View, layer, and networks)
   * @param  {string|undefined}  [id=undefined]
   * @param  {Object}  [options={}]
   * @return {Promise}
   */
  async disconnect (id = undefined, options = {}) {
    if (!id) {
      this._view.clear()
      this._networks.forEach(net => net.clear())
      this._networks = new Map()
      return this._layer.disconnect(id, options).then(() => {
        this._layer = undefined
      })
    } else {
      return this._layer.disconnect(id, options)
    }
  }

  /**
   * Send data to the specified peer.
   * Throw an error if no layer found or no peer found
   * @param  {string}  id
   * @param  {*}  data
   * @param  {*}  options
   * @return {Promise}
   */
  async send (id, data, options = {}) {
    const peer = this._view.get(id)
    if (peer) {
      if (this._layer) {
        data.options = options
        if (data.options.reply) {
          data.options.reply = uuid()
          return new Promise((resolve, reject) => {
            this.options.events.networks.once(data.options.reply, (id, data, options) => {
              resolve({ id, data, options })
            })
            this._layer.send(id, data)
          })
        } else {
          return this._layer.send(id, data)
        }
      } else {
        return Promise.reject(new Error('cant send the message to ' + id + '; no layer found'))
      }
    } else {
      return Promise.reject(new Error('cant send the message to ' + id + '; peer not found'))
    }
  }

  /**
   * Called uppon reception of a message from the layer
   * @param  {string} id
   * @param  {*} data
   * @param  {Object} [options={}]
   * @param  {function} [reply=undefined]
   * @return {void}
   */
  receive (id, data, options = {}, reply = undefined) {
    if (data.type === 'application') {
      this.options.get('core').receive(id, data.data, options)
    } else {
      if (data.options && typeof data.options.reply === 'string') {
        const type = data.options.reply
        reply = async (d) => {
          return this.send(id, { ...data, type, data: d }, {})
        }
        delete data.options
      }
      options.reply = reply
      this.options.events.networks.emit(data.type, id, data.data, options)
    }
  }

  // ==================================
  // =========== NEIGHBOURS ===========
  // ==================================

  /**
   * Called from a layer, it adds a new peer to our internal view
   * @param {string} peer
   * @param {Layer} layer the layer that called this method
   */
  addPhysicalNeighbourFromLayer (peer, layer) {
    debug('[%s] adding physical neighbour from layer: ', this.id, peer, layer.name)
    this._view.add(peer)
  }

  /**
   * Add a new physical peer to our internal view and ask the layer to create this connection if it does not exist yet. Otherwise throw an error if increaseOccurence is set to false
   * @param  {string}  peer
   * @param  {Boolean} [increaseOccurence=false]
   * @param {Network} the network that called this method
   * @return {Promise}
   */
  async addPhysicalNeighbourFromNetwork (peer, increaseOccurence = false, network) {
    debug('[%s] adding physical neighbour from network', this.id, peer)
    // first check if the connection already exsist on the layer.
    if (this._view.get(peer) !== false) {
      if (increaseOccurence) {
        this._view.add(peer, network.name)
      } else {
        throw new Error('the physical connection already exists')
      }
    } else {
      // create the connection
      await this._layer.connect(peer)
    }
  }

  /**
   * When a peer has been disconnected from the layer (aka crash or disconnection) the layer call this method to say to the manager a peer has disconnected
   * @param  {string} peer
   * @param  {Layer} layer
   * @return {void}
   */
  removePhysicalNeighbourFromLayer (peer, layer) {
    debug('removing neighbour: ', peer, layer.name)
    this._view.remove(peer)
  }

  /**
   * Increase the occurence of an existing connection.
   * @param {string} peer
   * @param {Network} network the network that called this method
   */
  addVirtualNeighbourFromNetwork (peer, network) {
    if (this._view.get(peer)) {
      this._view.add(peer, network.name)
    } else {
      throw new Error('[addVirtualNeighbour] peer not found')
    }
  }

  /**
   * Remove an occurence of an existing connection, or the physical connection if the network who is responsible for the connection has decrease the occurence to 0, the connection will be removed permanently.
   * @param  {string} peer
   * @return {void}
   */
  removeNeighbourFromNetwork (peer, network) {
    if (this._view.get(peer)) {
      this._view.remove(peer)
    } else {
      throw new Error('[removeNeighbour] peer not found')
    }
  }

  get neighbours () {
    return this._view.get()
  }

  // ==============================
  // =========== LAYER ===========
  // ==============================

  setLayer (layer) {
    if (this._layer) {
      throw new Error('layer already added.')
    } else {
      debug('adding layer: ', layer.name)
      this._layer = layer
      this.options.events.layer.on('data', (id, data, options) => {
        this.receive(id, data, options)
      })
    }
  }

  // ==============================
  // ========== NETWORKS ==========
  // ==============================

  addNetwork (network) {
    this._networks.set(network.name, network)
  }

  removeNetwork (key) {
    throw new Error('not yet implemented')
  }

  getNetwork (name) {
    throw new Error('not yet implemented')
  }

  get networks () {
    return [...this._networks.values()]
  }

  bindPeerToNetworkFromNetwork (id, network) {
    this.view.bindPeerToNetwork(id, network.name)
  }
}
