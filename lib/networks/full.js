const { AbstractNetwork } = require('../abstracts')
module.exports = class Full extends AbstractNetwork {
  constructor (name, options) {
    super(name, options)
    this._options.get(name).nameClass = 'Full'
    this._manager._view.events.on('add:physical', (...args) => {
      console.log('[%s][full] new physical connection', this._options.get('peer').id)
    })
    this._manager._view.events.on('add:virtual', (...args) => {
      console.log('[%s][full] new virtual connection', this._options.get('peer').id)
    })
  }
}
