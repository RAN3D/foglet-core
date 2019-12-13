const NetworksManager = require('./abstracts/manager')
const debug = require('debug')('foglet-core:manager')
const View = require('./view')

module.exports = class Manager extends NetworksManager {
  constructor (options) {
    super(options)
    this._nameClass = 'Manager'
    this._view = new View(this.options)
    this._layers = new Map()
    this._networks = new Map()
    this.options.set('manager', this)
    debug('Manager initialized.')
  }

  async connect (id, options = {}) {
    debug('connecting: ', id, options)
    this._layers.forEach(async (v, k) => {
      await v.connect(id, options)
    })
  }

  async send (id, data, options) {
    const peer = this._view.get(id)
    console.log('peer: ', peer)
    if (peer) {
      let sent = false
      if (peer.layers.length > 0) {
        const layers = [...peer.layers]
        while (!sent) {
          const layer = layers.pop()
          try {
            await layer.send(id, data)
            sent = true
          } catch (e) {
            console.error(e)
            if (layers.length === 0) {
              throw e
            } else {
              // try another layer.
            }
          }
        }
        return Promise.resolve()
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

  addPhysicalNeighbour (peer, layer) {
    debug('adding neighbour: ', peer, layer)
    this._view.add(peer, layer)
  }

  removePhysicalNeighbour (peer, layer) {
    debug('removing neighbour: ', peer, layer)
    this._view.remove(peer, layer)
  }

  addVirtualNeighbour (peer) {
    this._view.add(peer, undefined)
  }

  removeVirtualNeighbour (peer) {
    this._view.add(peer, undefined)
  }

  get neighbours () {
    return this._view.get()
  }

  // ==============================
  // =========== LAYERS ===========
  // ==============================

  addLayer (layer) {
    if (this._layers.has(layer.name)) {
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
      this._layers.set(layer.name, layer)
    }
  }

  removeLayer (name) {
    if (this._layers.has(name)) {
      this._layers.delete(name)
    } else {
      throw new Error('layer not found')
    }
  }

  getLayer (name) {
    if (this._layers.has(name)) {
      return this._layers.get(name)
    } else {
      throw new Error('layer not found')
    }
  }

  get layers () {
    return [...this._layers.values()]
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
