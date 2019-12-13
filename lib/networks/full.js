const { AbstractNetwork } = require('../abstracts')
module.exports = class Full extends AbstractNetwork {
  constructor (name, options) {
    super(name, options)
    this._options.get(name).nameClass = 'full-connected'
    this._manager._view.events.on('add:physical', (...args) => {
      console.log('[%s][full] new physical connection', this._options.get('peer').id)
    })
    this._manager._view.events.on('add:virtual', (...args) => {
      console.log('[%s][full] new virtual connection', this._options.get('peer').id)
    })

    this._receive.on('data', (id, data, options) => {
      console.log(id, data, options)
      console.log('[%s/Network(%s)] receive from %s:', this.options.get('peer').id, this.nameClass, id, data, options)
    })
  }
}
