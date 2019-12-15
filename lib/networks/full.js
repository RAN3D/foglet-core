const { AbstractNetwork } = require('../abstracts')
const debug = require('debug')('full-connected')
module.exports = class FullConnected extends AbstractNetwork {
  constructor (name, options) {
    super(name, options)
    this._nameClass = 'full-connected'
    this._view = []
    this.manager._view.events.on('add:physical', async (id) => {
      debug('[%s][full] new physical connection', this.id, this.options.get('peer').id)
      await this.manager.send(id, {
        type: this._nameClass,
        data: {
          order: 'connect-to-all',
          to: [...this._view, this.id]
        }
      })
      this._addEntry(id)
    })
    this.manager._view.events.on('add:virtual', (...args) => {
      // console.log('[%s][full] new virtual connection', this._options.get('peer').id)
    })

    this._receive.on('data', async (id, data, options) => {
      if (data.type === this._nameClass) {
        debug('[%s] receive from %s:', this.id, this._nameClass, id, data, options)
        // ===================================
        if (data.data.order === 'connect-to-all') {
          data.data.to.forEach(async (to) => {
            this.manager.addPhysicalNeighbourFromNetwork(to, false).then(() => {
              this._addEntry(to)
            }).catch(e => {
              // if already exsists do nothing
            }).finally(() => {
              this.manager.send(to, {
                type: this._nameClass,
                data: {
                  order: 'connect-to-me',
                  to: this.id
                }
              })
            })
          })
        } else if (data.data.order === 'connect-to-me') {
          this.manager.addPhysicalNeighbourFromNetwork(data.data.to, false).then(() => {
            this._addEntry(data.data.to)
          }).catch(e => {
            // if already exsists do nothing
          })
        }
      }
    })
  }

  _addEntry (id) {
    if (!this._view.includes(id)) {
      this._view.push(id)
    }
  }
}
