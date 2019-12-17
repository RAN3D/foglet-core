const Lock = require('../lock')
const EventEmitter = require('events')
const debug = require('debug')('foglet-core:network-view')
module.exports = class NetworkView extends EventEmitter {
  constructor (options, view) {
    super()
    this.options = options
    if (view) {
      this._view = view
    } else {
      this._view = new Map()
    }
    this._lock = new Lock(this.options.get('peer').id)
  }

  /**
   * Get the view and lock the view until we call the merge method
   * @param  {string}  [lock=undefined] lock identifier if provided
   * @return {Promise}  Resolved with an object {string: lock, Array<string>: view}
   */
  async get (lock = undefined) {
    debug('[%s] get(%s)', this.options.get('peer').id, lock)
    const loc = await this._lock.acquire(lock)
    return {
      lock: loc,
      view: [...this._view.keys()]
    }
  }

  /**
   * Merge add and remove arrays with the current view
   * @param  {string}  lock        the lock identifier needs to be provided and equals to the current lock identifier of this View.
   * @param  {Array}   [add=[]]    an array of identifier to add
   * @param  {Array}   [remove=[]] an array of identifier to remove
   * @return {Promise} Resolved when the merge has been completed and the lock released.
   */
  async merge (lock, add = [], remove = [], occ = false, throwable = true) {
    debug('[%s] merge: ', this.options.get('peer').id, lock, add, remove, occ, throwable)
    if (lock === this._lock.id) {
      // merge add
      for (let i = 0; i < add.length; i++) {
        const id = add[i]
        const exist = this._view.has(id)
        if (!exist) {
          this._view.set(id, 1)
        } else if (occ && exist) {
          this._view.set(id, this._view.get(id) + 1)
        }
      }
      // merge remove
      for (let i = 0; i < remove.length; i++) {
        const id = remove[i]
        if (this._view.has(id)) {
          let entry = this._view.get(id)
          if (occ) {
            entry -= 1
          }
          if (entry === 0) {
            this._view.delete(id, id)
          }
        } else {
          if (throwable) {
            throw new Error('[LockedView] remove cannot be completed, error: peer not found: ' + id)
          }
        }
      }
      if (this._lock.isLocked()) {
        this._lock.release()
      }
    } else {
      throw new Error('you cannot merge a view with a wrong lock, please provide the same lock as the one owned by this view')
    }
  }
}
