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
  async join (id = undefined, options = {}) {
    if (!id) {
      // first connection
      const peer = await this._layer.connect(id, options)
      // wait for all networks to be initialized, listen on initialized event from every network
      const networks = this.networks
      for (let i = 0; i < networks.length; i++) {
        await networks[i].join(peer)
      }
    } else {
      throw new Error('already connected')
    }
  }

  /**
   * Used by networks, it connects or add arcs to the 'to' peer or try to connect to this peer using the 'by' peer
   * Multiple options,
   * @param  {Network}  network
   * @param  {string}  [to=undefined]
   * @param  {string}  [by=undefined]
   * @param  {Boolean} [occ=false]
   * @return {Promise}
   */
  async connect (network, to = undefined, by = undefined, occ = false) {
    if (!to) {
      throw new Error('[connect] to needs to be defined because you are not joining the network')
    }
    if (this._view.has(to) && occ) {
      this._view.add(to, network.name)
    } else if (!this._view.has(to) && !by) {
      // two posssibilities, the layer allows this kind of connections or not
      // or only allow connections by exchanging offers through peer already connected. Then if the connection is not possible
      const p = await this._layer.connect(to, { by })
      this._view.add(p, network.name)
    } else if (!this._view.has(to) && by) {
      // two posssibilities, the layer allows this kind of connections
      // or only allow connections by exchanging offers through peer already connected. Then if the connection is not possible
      const p = await this._layer.connect(to, { by })
      this._view.add(p, network.name)
    } else if (this._view.has(to) && this._view.has(by) && to === by) {
      // here you want to revert an arc. Eg: you are A and connected to B
      // A => B, then you want to create B => A
      return this._layer.connect(to, { by })
    } else {
      throw new Error('[connect] forbidden')
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
   * @param {Network} network the network responsible for this neighbour
   */
  addPhysicalNeighbour (peer, network = undefined) {
    debug('[%s] adding physical neighbour: ', this.id, peer)
    this._view.add(peer, network)
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
      this.options.events.layer.on('add:physical', peer => {
        this.networks.forEach(net => {
          net.addNeighbour(peer).then(() => {
            this.addPhysicalNeighbour(peer, net)
          })
        })
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
}
