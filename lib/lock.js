const Utils = require('./utils')
const uuid = require('uuid/v4')
const debug = require('debug')('lock')
module.exports = class Lock {
  constructor (id) {
    this._owner = id
    this._id = uuid()
    this._lock = false
  }

  /**
   * Lock until the variable _lock has not been released
   * Does not block the UI
   * @return {Promise}
   */
  async acquire (id) {
    if (id < this._id | !id) {
      debug('[%s] authorizing (%s), lock (%s)', this._owner, id, this._id)
      return this._id
    } else {
      if (this._lock) {
        debug('[%s] waiting (%s)', this._owner, this._id)
        await Utils.asyncWhile(() => !this.islocked())
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
  islocked () {
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
