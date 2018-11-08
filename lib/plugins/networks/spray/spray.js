const Errors = require('../../../errors')
const AbstractNetwork = require('../../../abstract-network')
class Spray extends AbstractNetwork {
  constructor (...args) {
    super(...args)
    this.name = 'spray-wrtc'
  }
}
module.exports = Spray
