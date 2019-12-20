const { AbstractNetwork } = require('../abstracts')
const debug = require('debug')('full')

/**
 * Create a full connected network.
 * Pay attention that this kind of network configuration is well suited for small networks < 50 peers. (50 peers means you have 50*49 connections in your network. Imagine for 1000 users. :P)
 * But for big networks you should use Random Peer Sampling protocols.
 * @type {FullConnected}
 */
module.exports = class FullConnected extends AbstractNetwork {
  constructor (name, options) {
    super(name, options)
    this._nameClass = 'FullConnected'
  }

  async join (id = undefined) {
    console.log(this.name, id)
    if (!id) {
      this._initialized = true
      return Promise.resolve()
    } else {
      // first connect the new peer to us
      await this.manager.connect(this, id, id, false)
      const message = await this.send(id, {
        except: this.id,
        message: 'join'
      }, { reply: true })
      console.log(message)
      this._initialized = true
    }
  }

  async receive (id, data, options) {
    console.log(this.name, id, data, options)
  }
}
