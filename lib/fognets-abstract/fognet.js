const EventEmitter = require('EventEmitter')
module.exports = class FogNet extends EventEmitter {
  constructor (options) {
    super()
    this.options = options
  }
  /**
   * Send a message using this interface
   * @param  {Object} m the message to send
   * @return {Promise} Return a Promise resolved when the message is sent.
   */
  send (m) {
    throw new Error('not yet implemented')
  }
  /**
   * You are responsible to call this method when you have to deliver a message
   * @param  {Object} m the message to deliver
   * @return {void}
   */
  _receive (m) {
    /**
     * @event CommunicationInterface#receive
     * @type {Object}
     */
    this.emit('receive', m)
  }
}
