const NetworksManager = require('./abstracts/manager')
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
        const networks = this.networks
        for (let i = 0; i < networks.length; i++) {
          await networks[i].join(peer)
        }
      }
    } else {
      throw new Error('already connected')
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
  async send (id, data, options = {}, reply = false) {
    const peer = this._view.get(id) || this._layer.has(id)
    if (peer || (reply && !peer)) {
      if (this._layer) {
        data.__options = { ...options }
        if (data.__options.reply) {
          data.__options.reply = uuid()
          return new Promise((resolve, reject) => {
            this.options.events.networks.once(data.__options.reply, (id, data, options) => {
              resolve({ id, data, options })
            })
            this._layer.send(id, data, options).catch(err => {
              reject(err)
            })
          })
        } else {
          return this._layer.send(id, data, { ...options, reply })
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
      if (data.__options && typeof data.__options.reply === 'string') {
        const type = data.__options.reply
        reply = async (d) => {
          return this.send(id, { ...data, type, data: d }, {})
        }
        delete data.__options
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
  addPhysicalNeighbour (peer, network = undefined) {
    debug('[%s] adding physical neighbour: ', this.id, peer)
    this._view.add(peer, network)
    this.options.events.manager.emit('add:physical', peer)
  }

  /**
   * Add a new physical peer to our internal view and ask the layer to create this connection if it does not exist yet. Otherwise throw an error if increaseOccurence is set to false
   * @param  {string}  peer
   * @param  {Boolean} [increaseOccurence=false]
   * @param {Network} the network that called this method
   * @return {Promise}
   */
  async addNeighbourFromNetwork (peer, increaseOccurence = false, network) {
    debug('[%s] adding physical neighbour from network', this.id, peer)
    if (this._view.get(peer) !== false && !increaseOccurence) {
      throw new Error('Peer already exist: ' + peer)
    } else if ((this._view.get(peer) !== false) || (this._layer.has(peer) && this._view.get(peer) === false)) {
      this._view.add(peer, network.name)
    } else if (!this._view.get(peer) && !this._layer.has(peer)) {
      const connectedTo = await this._layer.connect(peer, { by: this.id })
      if (connectedTo === peer) {
        this.addPhysicalNeighbour(connectedTo, network.name)
      } else {
        throw new Error('[addPhysicalNeighbourFromNetwork] identifiers are not equal, report')
      }
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
