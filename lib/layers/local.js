const Layer = require('../abstracts/layer')
const Utils = require('../utils')

const neighborhood = new Map()
const peers = new Map()

module.exports = class LocalLayer extends Layer {
  constructor (...args) {
    super(...args)
    this._nameClass = 'LocalLayer'
  }

  async connect (id, options = {}) {
    if (!id) {
      // first try to connect
      if (peers.size === 0) {
        // we are alone
        peers.set(this.id, this)
        neighborhood.set(this.id, [])
        return Promise.resolve(undefined)
      } else {
        if (!peers.has(this.id)) {
          const rn = Utils.pickRandom([...peers.keys()], [])
          peers.set(this.id, this)
          neighborhood.set(this.id, [rn])
          // warn the manager we have a new neighbour
          await this.manager.addPhysicalNeighbourFromLayer(rn, this)
          return Promise.resolve(rn)
        } else {
          return Promise.reject(new Error('Already connected'))
        }
      }
    } else {
      // if id is specified
      // check if we have this neighbour
      if (neighborhood.has(this.id) && neighborhood.get(this.id).includes(id)) {
        return Promise.reject(new Error('connection already exists'))
      } else if (neighborhood.has(this.id) && !neighborhood.get(this.id).includes(id)) {
        neighborhood.set(this.id, [...neighborhood.get(this.id), id])
        // warn the manager we have a new neighbour
        await this.manager.addPhysicalNeighbourFromLayer(id, this)
        return Promise.resolve(id)
      } else {
        // nothing ???
        throw new Error('report: local, noop')
      }
    }
  }

  /**
   * Send data to the destination id
   * @param  {string} id
   * @param  {*} data
   * @param  {*} options
   * @return {Promise}
   */
  async send (id, data, options) {
    if (neighborhood.get(this.id).includes(id)) {
      peers.get(id).receive(this.id, data, options)
    } else {
      throw new Error('local layer: peer not found' + id)
    }
  }

  receive (id, data, options) {
    this._receiveCallback(id, data, options)
  }

  async disconnect (id) {
    if (!id) {
      peers.clear()
      neighborhood.clear()
    }
  }
}
