const AbstractModule = require('../../../abstract-module')
class StreamUnicast extends AbstractModule {
  constructor (...args) {
    super(...args)
    this.name = 'stream-unicast'
  }
}
module.exports = StreamUnicast
