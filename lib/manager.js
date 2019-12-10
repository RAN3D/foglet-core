const NetworksManager = require('./abstracts/networksManager')
const debug = require('debug')('foglet-core:manager')
module.exports = class Manager extends NetworksManager {
  constructor (options) {
    super(options)
    this._nameClass = 'Manager'
    debug('Manager initialized.')
  }
}
