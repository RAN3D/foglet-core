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
    /**
     * On new physical connection, just react by connecting all neighbours to the new peer including our-self
     */
    this.manager.view.on('add:physical', async (id) => {
      await this.join(id)
    })
  }

  async join (id) {
    // the view is locked until we unlock it,
    // using the merge function of the view
    const { lock, view } = await this.view.get()
    const toAdd = []
    const toRemove = []
    if (!view.includes(id)) {
      debug('[%s][full(%s)] new physical connection to: %s', this.id, this.name, id)
      try {
        try {
          const response = await this.send(id, {
            order: 'connect-to-all',
            to: [...view, this.id],
            lock: String(lock)
          }, { reply: true })
          debug(response)
        } catch (e) {
          console.error(new Error('Error during sending connect-to-all order to: ' + id))
          throw e
        }

        for (let i = 0; i < view.length; i++) {
          const to = view[i]
          if (id !== to) {
            // send a message to 'to' to connect to us
            try {
              const response = await this.send(to, {
                order: 'connect-to-me',
                to: this.id,
                lock
              }, { reply: true })
              debug(response)
            } catch (e) {
              console.error('[%s] Error during sending connecte-to-me message: ', this.id, e)
            }
          }
        }
        toAdd.push(id)
        await this.manager.bindPeerToNetworkFromNetwork(id, this)
      } catch (e) {
        console.error(e)
      }
    }
    // unlock the view
    this.view.merge(lock, toAdd, toRemove)
    // set the initialized state to true
    this._initialized = true
  }

  async receive (id, data, options) {
    debug('[%s/Network(%s)] receive: ', this.id, this.name, id, data, options)
    if (data.order === 'connect-to-all') {
      // ======== BEGIN: CONNECT-TO-ALL ========
      // lock the view  or pass the lock to know if we must wait or not until we add all connections
      const { lock } = await this.view.get(data.lock)
      const toAdd = []
      const toRemove = []

      for (let i = 0; i < data.to.length; i++) {
        const to = data.to[i]
        try {
          await this.manager.addPhysicalNeighbourFromNetwork(to, false, this)
          toAdd.push(to)
        } catch (e) {
          //
        }
      }
      if (options.reply) {
        try {
          // unlock the view and reply to the joiner
          await options.reply(true)
        } catch (e) {
          console.error(new Error('Error during reply: ', e))
          // if we cannot contact the peer, remove its id from those who must be added
          const index = toAdd.indexOf(id)
          if (index > -1) {
            toAdd.splice(index)
          } else {
            console.error(new Error('Error trying to remove the peer after error during reply id=' + id, e))
          }
        }
      }
      await this.view.merge(lock, toAdd, toRemove)
      // ======== END: CONNECT-TO-ALL ========
    } else if (data.order === 'connect-to-me') {
      // ======== BEGIN: CONNECT-TO-ME ========
      const { lock, view } = await this.view.get(data.lock)
      const toAdd = []
      const toRemove = []
      if (!view.includes(data.to)) {
        try {
          await this.manager.addPhysicalNeighbourFromNetwork(data.to, false, this)
          toAdd.push(data.to)
        } catch (e) {
          //
        }

        if (options.reply) {
          try {
            await options.reply(true)
          } catch (e) {
            console.error(new Error('Error during reply: ', e))
            // if we cannot contact the peer, remove its id from those who must be added
            const index = toAdd.indexOf(data.to)
            if (index > 0) {
              toAdd.splice(index)
            } else {
              console.error(new Error('Error trying to remove the peer after error during reply id=' + id, e))
            }
          }
        }
      } else {
        // we already have the connection
        if (options.reply) {
          try {
            // unlock the view and reply to the joiner
            await options.reply(true)
          } catch (e) {
            console.error(new Error('Error during reply: ', e))
          }
        }
      }
      // unlock by merging
      await this.view.merge(lock, toAdd, toRemove)
      // ======== END: CONNECT-TO-ME ========
    }
  }
}
