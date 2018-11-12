const AbstractModule = require('../../../abstract-module')
class Unicast extends AbstractModule {
  constructor (...args) {
    super(...args)
    this.name = 'unicast'
  }
  /**
   * Listen on incoming message
   * @param {function} callback a callback called upon new message (id, message) => {....}
   * @return {void}
   */
  on (protocol, callback) {
    this.network.on('receive', (id, message) => {
      if (message.protocol === protocol) {
        try {
          callback(id, message.message)
        } catch (e) {
          console.error('Error when listening on message from %s on the protocol %s for the message: ', id, protocol, message)
        }
      }
    })
  }
  /**
   * Send a message on the protocol specified in options to the peer identified by its id
   * @param  {String} id      The identifier of the peer to send the message to
   * @param  {Object} message Data to send
   * @return {Promise} Resolved when the message is sent
   */
  send (protocol, id, message) {
    console.log('Sending data to %s on the protocol %s', id, protocol)
    return this.network.send(id, { protocol, message })
  }
}
module.exports = Unicast
