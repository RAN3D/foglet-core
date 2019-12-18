const Utils = require('../utils')
const protocols = new Map()
const debug = require('debug')('foglet-core:local-signaling')
/**
 * This is a local signaling server
 * @type {Object}
 */
module.exports = class LocalSignaling {
  constructor () {
    this.neighborhood = new Map()
    this.participants = new Map()
  }

  static protocols () {
    return protocols
  }

  /**
   * The join method just return the identifier of the peer you will be connected with. Return undefined if you are alone, otherwise a random id if you are not connected yet or return options.by if set and there otherwise reject
   * @return {Promise} resolve with the identifier | undefined if you are alone
   */
  async join (from, to = undefined, peer) {
    if (this.participants.size === 0) {
      this.participants.set(from, peer)
      this.neighborhood.set(from, [])
      return Promise.resolve(undefined)
    } else {
      if (!this.participants.has(from)) {
        if (to) {
          if (this.participants.has(to)) {
            this.participants.set(from, peer)
            return Promise.resolve(to)
          } else {
            return Promise.reject(new Error('cannot find the paticipant: ' + to))
          }
        } else {
          const rn = Utils.pickRandom([...this.participants.keys()], [])
          this.participants.set(from, peer)
          return Promise.resolve(rn)
        }
      } else {
        return Promise.reject(new Error('already connected'))
      }
    }
  }

  /**
  * Send an offer through a third party signaling mechanism to the specified peer.
  * @param  {string}  from
  * @param  {string}  to
  * @return {Promise}      [description]
  */
  async forward (from, to, event, offer) {
    debug('signaling: forward offer from %s to %s : ', from, to, event, offer)
    if (this.participants.has(to)) {
      this.participants.get(to)._events.emit(event, from, to, offer)
    } else {
      throw new Error('destination not found:' + to)
    }
  }
}
