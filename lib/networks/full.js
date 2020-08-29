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
      // at this point we have a connection to the peer who is alone in the network,
      // eg: B -> A, now we need to create a bidirectional connection
      // A -> B
      debug('[%s] joining %s to %s', this.id, this.name, id)
      // first connect the new peer to us: A -> B
      // using this method we ask the manager to create a
      // connection starting from the new peer identified by its id to us
      await this.manager.connect(this, id, id, false)
      // ask for all of its neighbours
      const answer = await this.send(id, {
        type: 'get-neighbours'
      }, { reply: true })
      const neighView = answer.data
      // console.log('[%s] view of %s:', this.id, id, neighView)
      for (let index = 0; index < neighView.length; index++) {
        const element = neighView[index]
        if (this.id !== element.id && id !== element.id) {
          // console.log('[%s] connecting to %s by %s', this.id, element.id, id)
          await this.manager.connect(this, element.id, id)
          // then reverse the link
          await this.manager.connect(this, element.id, element.id)
        }
      }
      this._initialized = true
    }
  }

  async receive (id, data, options) {
    debug('receive:', this.name, id, data, options)
    if (data.type === 'get-neighbours' && typeof options.reply === 'function') {
      try {
        const { lock, view } = await this.getView()
        await options.reply(view)
        // unlock the view
        this.mergeView(lock)
      } catch (e) {
        console.error(e)
      }
    }
  }
}
