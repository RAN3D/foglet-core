const { AbstractNetwork } = require('../abstracts')
const debug = require('debug')('foglet-core:full')

/**
 * Create a full connected network.
 * Pay attention that this kind of network configuration is well suited for small networks < 50 peers. (50 peers means you have 50*49 connections in your network. Imagine for 1000 users. :P)
 * For big networks you should use Random Peer Sampling protocols.
 * @type {FullConnected}
 */
module.exports = class FullConnected extends AbstractNetwork {
  constructor (name, options) {
    super(name, options)
    this._nameClass = 'FullConnected'
  }

  async join (id = undefined) {
    if (!id) {
      debug('[%s] joining %s as first peer', this.id, this.name)
      this._initialized = true
      return Promise.resolve()
    } else {
      debug('[%s] joining %s to %s', this.id, this.name, id)
      this._initialized = true
      // // first connect the new peer to us
      await this.manager.connect(this, id, id, false)
      // const message = await this.send(id, {
      //   except: this.id,
      //   message: 'join'
      // }, { reply: true })
      // debug('message', message)
    }
  }

  async receive (id, data, options) {
    debug('receive:', this.name, id, data, options)
    if (typeof options.reply === 'function') {
      try {
        await options.reply('sjdkhfkjhsdkjh')
      } catch (e) {
        console.error(e)
      }
    }
  }
}
