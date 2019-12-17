const Utils = require('./utils')
const uuid = require('uuid/v4')
const debug = require('debug')('foglet-core:lock')
module.exports = class Lock {
  constructor (id) {
    this._owner = id
    this._id = uuid()
    this._lock = false
  }

  /**
   * Return the owner of the lock (options.get('peer').id)
   * @return {string}
   */
  get owner () {
    return this._owner
  }

  /**
   * Return the value of the lock
   * @return {string} uuid v4
   */
  get id () {
    return this._id
  }

  /**
   * Lock until the variable _lock has not been released
   * Does not block the UI
   * @return {Promise}
   */
  async acquire (id) {
    if (id < this._id | (!id && !this._lock)) {
      debug('[%s] authorizing (%s), lock (%s)', this._owner, id, this._id)
      return this._id
    } else {
      if (this._lock) {
        debug('[%s] waiting (%s)', this._owner, this._id)
        await Utils.asyncWhile(() => !this.isLocked())
      }
      debug('[%s] locking (%s)', this._owner, this._id)
      this._lock = true
      return this._id
    }
  }

  /**
   * Return true if locked or false otherwise
   * @return {Boolean}
   */
  isLocked () {
    return this._lock
  }

  /**
   * Release the lock, aka set the variable _lock to false
   * @return {Promise}
   */
  async release () {
    debug('[%s] unlocking (%s)', this._owner, this._id)
    this._lock = false
  }
}
