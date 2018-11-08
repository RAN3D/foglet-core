const Errors = require('../../../errors')
const AbstractNetwork = require('../../../abstract-network')
class FullMesh extends AbstractNetwork {
  constructor () {
    super()
    throw Errors.notYetImplemented('FullMesh Network')
  }
}
module.exports = FullMesh
