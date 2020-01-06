'use strict'

const EventEmitter = require('events')
module.exports = class View extends EventEmitter {
  constructor (options, view) {
    super()
    this.options = options
    if (view) {
      this._view = view
    } else {
      this._view = new Map()
    }
  }

  /**
   * Given a network add the id as its neighbour
   * @param {Network} network
   * @param {String} id identifier of the neighbour ot add
   */
  add (network, id) {
    if (!this._view.has(id)) {
      const obj = {}
      obj[network.name] = 0
      this._view.set(id, {})
      this.emit('add:' + network.name + '-new', id)
    }
    this._view.get(id)[network.name]++
    this.emit('add:' + network.name + '-occurence', id)
  }

  /**
   * Given a network and the id of the neighbour to remove, it removes an arc from its neighborhood, or remove completely if the number of arcs is 0
   * @param  {Network} network
   * @param  {String} id
   * @return {boolean} true if removed or decreased, false (aka error) otherwise
   */
  remove (network, id) {
    if (!this._view.has(id)) {
      return false
    }
    if (!this._view.get(id)[network.name]) {
      return false
    }
    this._view.get(id)[network.name]--
    this.emit('remove:' + network.name + '-occurence', id)
    if (this._view.get(id)[network.name] === 0) {
      delete this._view.get(id)[network.name]
    }
    if (Object.keys(this._view.get(id)).length === 0) {
      this._view.delete(id)
    }
    this.emit('remove:' + network.name, id)
    return true
  }

  /**
   * If id and network are specified, return the number of occurence for this couple. If id is undefined, return the global view for this network.
   * @param  {Network} network
   * @param  {String} id
   * @return {Array|Number}
   */
  get (network, id) {
    if (!id) {
      // return the view only for the network specified
      const m = []
      this._view.keys().forEach((v, k) => {
        if (v[network.name]) {
          m.push({ id: k, occurence: v[network.name] })
        }
      })
      return m
    } else {
      if (!this._view.has(id)) {
        return undefined
      }
      if (this._view.get(id)[network.name]) {
        return this._view.get(id)[network.name]
      } else {
        return undefined
      }
    }
  }

  /**
   * Return true or false if it exists such identifier for the specified network
   * @param  {Network}  network
   * @param  {String}  id
   * @return {Boolean}
   */
  has (network, id) {
    return this._view.has(id) && this._view.get(id)[network.name] !== undefined
  }

  /**
   * Clear the view for a network, or all the network.
   * @param  {Network} network
   * @return {void}
   */
  clear (network) {
    if (network) {
      this._view.keys().forEach((v, k) => {
        if (v[network.name]) {
          delete v[network.name]
        }
        if (Object.keys(v).length === 0) {
          this._view.delete(k)
        }
      })
    } else {
      this._view.clear()
    }
  }
}
