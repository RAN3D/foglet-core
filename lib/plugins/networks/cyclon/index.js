const Errors = require('../../../errors')
const AbstractNetwork = require('../../../abstract-network')
class Cyclon extends AbstractNetwork {
  constructor () {
    super()
    throw Errors.notYetImplemented('Cyclon Network')
  }
}
module.exports = Cyclon
