const Network = require('../abstracts/network')
module.exports = class Full extends Network {
  constructor (name, options) {
    super(name, options)
    this.options.get(name).nameClass = 'Full'
  }
}
