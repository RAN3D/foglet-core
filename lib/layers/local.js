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
        return Promise.resolve()
      } else {
        if (!peers.has(this.id)) {
          const rn = Utils.pickRandom([...peers.keys()], [])
          peers.set(this.id, this)
          neighborhood.set(this.id, [rn])
          console.log('[%s] id: %s, new random peer', this.id, rn)
          // warn the manager we have a new neighbour
          await this.manager.addPhysicalNeighbour(rn, this)
        } else {
          // else, already connected, but need to find a new neighbour
          const rn = Utils.pickRandom([...peers.keys()], [this.id])
          const neigh = neighborhood.get(this.id)
          // only add the physical connection if does not exist
          if (!neigh.includes(rn)) {
            neigh.push(this.id)
            neighborhood.set(this.id, neigh)
          }
          console.log('[%s] id: %s, already connected, no id provided, find a random one, new random peer', this.id, rn)
          // warn the manager we have a new neighbour
          await this.manager.addPhysicalNeighbour(rn, this)
        }
        return Promise.resolve()
      }
    } else {
      // if id is specified
      // check if we have this neighbour
      if (neighborhood.has(this.id) && neighborhood.get(this.id).includes(id)) {
        console.log('[%s] id: %s, already exists', this.id, id)
        await this.manager.addPhysicalNeighbour(id, this)
      } else if (neighborhood.has(this.id) && !neighborhood.get(this.id).includes(id)) {
        neighborhood.set(this.id, [...neighborhood.get(this.id), id])
        console.log('[%s] id: %s, new peer', this.id, id)
        // warn the manager we have a new neighbour
        await this.manager.addPhysicalNeighbour(id, this)
      } else {
        // nothing ???
        console.log('noop')
      }
    }
  }

  send (id, data, options) {

  }
}
