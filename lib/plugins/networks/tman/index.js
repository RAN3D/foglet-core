const Errors = require('../../../errors')
const AbstractNetwork = require('../../../abstract-network')
class Tman extends AbstractNetwork {
  constructor () {
    super()
    throw Errors.notYetImplemented('Tman Network')
  }
}
module.exports = Tman
