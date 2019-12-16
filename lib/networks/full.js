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
    this.options.events.view.on('add:physical', async (id) => {
      await this.join(id)
    })
  }

  async join (id) {
    const lock = await this._lock.acquire()
    if (!this._view.includes(id)) {
      debug('[%s][full(%s)] new physical connection to: %s', this.id, this.name, id)
      try {
        const response = await this.send(id, {
          order: 'connect-to-all',
          to: [...this._view, this.id],
          lock
        }, { reply: true })
        debug(response)
        for (let i = 0; i < this._view.length; i++) {
          const to = this._view[i]
          if (id !== to) {
            // send a message to 'to' to connect to us
            await this.send(to, {
              order: 'connect-to-me',
              to: this.id,
              lock
            }, { reply: true }).then((r) => {
              debug(r)
            }).catch(e => {
              console.error(new Error('Error when connect-to: ', e))
            })
          }
        }
        this._addEntry(id)
      } catch (e) {
        console.error(e)
        this._lock.release()
      }
    }
    this._lock.release()
    this._initialized = true
  }

  async receive (id, data, options) {
    debug('[%s/Network(%s)] receive: ', this.id, this.name, id, data, options)
    if (data.order === 'connect-to-all') {
      // lock the view  or pass the lock to know if we must wait or not until we add all connections
      await this._lock.acquire(data.lock)
      for (let i = 0; i < data.to.length; i++) {
        const to = data.to[i]
        try {
          await this.manager.addPhysicalNeighbourFromNetwork(to, false, this)
        } catch (e) {
          //
        }
        this._addEntry(to)
      }
      if (options.reply) {
        try {
          // unlock the view and reply to the joiner
          await this._lock.release()
          return options.reply(true)
        } catch (e) {
          console.error(new Error('Error during reply: ', e))
          await this._lock.release()
        }
      }
    } else if (data.order === 'connect-to-me') {
      if (!this._view.includes(data.to)) {
        // lock the view until we add the entry
        await this._lock.acquire(data.lock)
        this.manager.addPhysicalNeighbourFromNetwork(data.to, false, this).then(() => {
          this._addEntry(data.to)
        }).catch(e => {
          // if already exsists do nothing
        }).finally(async () => {
          if (options.reply) {
            try {
              // unlock the view and reply to the joiner
              await this._lock.release()
              return options.reply(true)
            } catch (e) {
              console.error(new Error('Error during reply: ', e))
              await this._lock.release()
            }
          }
        })
      } else {
        // we already have the connection
        if (options.reply) {
          try {
            // unlock the view and reply to the joiner
            return options.reply(true)
          } catch (e) {
            console.error(new Error('Error during reply: ', e))
          }
        }
      }
    }
  }

  /**
   * add the entry in our if does not exist yet
   * @param {string} id
   */
  _addEntry (id) {
    if (!this._view.includes(id)) {
      this._view.push(id)
      this.manager.bindPeerToNetworkFromNetwork(id, this)
    }
  }
}
