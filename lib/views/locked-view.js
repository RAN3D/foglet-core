const View = require('./view')
const Lock = require('../lock')
const debug = require('debug')('foglet-core:locked-view')
module.exports = class LockedView extends View {
  constructor (...args) {
    super(...args)
    this._locks = new Map()
  }

  /**
   * @private
   * getter on the global view
   * Please do not use this method for managing views...
   * @return {Map} Map of the identifier storing networks identifier with their network and number of occurrences
   */
  get view () {
    return this._view
  }

  /**
   * Get the view and lock the view until we call the merge method
   * @param {Network} network the network who call this method
   * @param  {string}  [lock=undefined] lock identifier if provided
   * @param {string} [id=undefined] identifier of the neighbour we want the complete view
   * @return {Promise}  Resolved with an object {string: lock, Array<string>: view}
   */
  async get (network, lock = undefined, id = undefined) {
    if (!network || !network.name) throw new Error('network or network.name not specified')
    if (!this._locks.has(network.name)) {
      // create the lock
      this._locks.set(network.name, new Lock(this.options.get('peer').id))
    }
    debug('[%s] get(%s, %s)', this.options.get('peer').id, lock, id)
    const loc = await this._locks.get(network.name).acquire(lock)
    return {
      lock: loc,
      view: this.get(network, id)
    }
  }

  /**
   * Merge add and remove arrays with the current view
   * @param {Network} network the network who call this method
   * @param  {string}  lock        the lock identifier needs to be provided and equals to the current lock identifier of this View.
   * @param  {Array}   [add=[]]    an array of identifier to add
   * @param  {Array}   [remove=[]] an array of identifier to remove
   * @return {Promise} Resolved when the merge has been completed and the lock released.
   */
  async merge (network, lock, add = [], remove = [], occ = false, throwable = true) {
    if (!network || !network.name) throw new Error('network or network.name not specified')
    debug('[%s] merge: ', this.options.get('peer').id, network.name, lock, add, remove, occ, throwable)
    if (!this._locks.has(network.name)) {
      throw new Error('you cannot merge before creating the lock, use get before.')
    }
    const lc = this._locks.get(network.name)
    if (lock === lc.id) {
      // merge add
      for (let i = 0; i < add.length; i++) {
        this.add(network, add[i])
      }
      // merge remove
      for (let i = 0; i < remove.length; i++) {
        const removed = this.remove(network, remove[i])
        if (!removed) {
          throw new Error('id ' + remove[i] + ' cannot be removed.')
        }
      }
      if (lc.isLocked()) {
        lc.release()
      }
    } else {
      throw new Error('you cannot merge a view with a wrong lock, please provide the same lock as the one owned by this view')
    }
  }
}
