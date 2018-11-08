const AbstractModule = require('../../../abstract-module')
class Unicast extends AbstractModule {
  constructor (...args) {
    super(...args)
    this.name = 'unicast'
  }
}
module.exports = Unicast
