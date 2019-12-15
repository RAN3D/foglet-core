const NetworksManager = require('./abstracts/manager')
const debug = require('debug')('foglet-core:manager')
const View = require('./view')

module.exports = class Manager extends NetworksManager {
  constructor (options) {
    super(options)
    this._nameClass = 'Manager'
    this._view = new View(this.options)
    this._layer = null
    this._networks = new Map()
    this.options.set('manager', this)
  }

  async connect (id, options = {}) {
    debug('connecting:', id, options)
    return this._layer.connect(id, options)
  }

  async send (id, data, options) {
    const peer = this._view.get(id)
    if (peer) {
      if (this._layer) {
        return this._layer.send(id, data, options)
      } else {
        return Promise.reject(new Error('cant send the message to ' + id + '; no layer found'))
      }
    } else {
      return Promise.reject(new Error('cant send the message to ' + id + '; peer not found'))
    }
  }

  // ==================================
  // =========== NEIGHBOURS ===========
  // ==================================

  addPhysicalNeighbourFromLayer (peer, layer) {
    debug('adding physical neighbour from layer: ', peer, layer.name)
    this._view.add(peer)
  }

  async addPhysicalNeighbourFromNetwork (peer, increaseOccurence = false) {
    debug('adding physical neighbour from network', peer)
    // first check if the connection already exsist on the layer.
    if (this._view.get(peer) !== false) {
      if (increaseOccurence) {
        this._view.add(peer)
      } else {
        throw new Error('the physical connection already exists')
      }
    } else {
      // create the connection
      await this._layer.connect(peer)
    }
  }

  removePhysicalNeighbourFromLayer (peer, layer) {
    debug('removing neighbour: ', peer, layer.name)
    this._view.remove(peer, layer)
  }

  addVirtualNeighbour (peer) {
    this._view.add(peer)
  }

  removeVirtualNeighbour (peer) {
    this._view.remove(peer)
  }

  get neighbours () {
    return this._view.get()
  }

  // ==============================
  // =========== LAYERS ===========
  // ==============================

  setLayer (layer) {
    if (this._layer) {
      throw new Error('layer already added.')
    } else {
      debug('adding layer: ', layer.name)
      layer._receive.on('data', (id, data, options) => {
        if (data.type === 'application') {
          this.options.get('core').receive(id, data.data, options)
        } else {
          this._networks.forEach((v, k) => {
            v.receive(id, data, options)
          })
        }
      })
      this._layer = layer
    }
  }

  unsetLayer (name) {
    this._layer.clear()
    this._layer = undefined
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
