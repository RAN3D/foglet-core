const AbstractNetwork = require('../../../abstract-network')
const GeneralOptions = require('../../../options')
const SprayNetwork = require('spray-wrtc')
const Errors = require('../../../errors')
const lmerge = require('lodash.merge')

class Spray extends AbstractNetwork {
  constructor (foglet, options) {
    options = lmerge(GeneralOptions.network, options)
    super(foglet, options)
    this.name = 'spray-wrtc'
    this._spray = new SprayNetwork(this.options)
    this._spray.on('receive', (id, message) => {
      this.emit('receive', id, message)
    })
  }
  get id () {
    return this._spray.id
  }

  /**
   * Connect the peer to a network using direct or signaling exchange of offers. see (n2n-wrtc)
   * @param  {AbstractNetwork|undefined} instance Another instance or undefined
   * @return {Promise}
   */
  connect (instance) {
    return this._spray.connect(instance._spray)
  }
  /**
   * Disconnect the peer from the network
   * @param  {peerId|undefined} peerId if peerId, disconnect only the connection attached to this peer. Or disconnect all connections.
   * @return {Promise}
   */
  disconnect (peerId) {
    return this._spray.disconnect(peerId)
  }
  /**
   * Send a message to a peer identified by its id on the protocol 'protocol'
   * When a message is received you need to emit (using an EventEmitter) on the event 'protocol' with as parameters
   * the id of sender and the message received
   * => this.on(protocol, id, message)
   * @param  {String} id       identifier of the peer to send the message to
   * @param  {Object} message  the message to send
   * @return {Promise} A promise resolved when the message is sent, rejected otherwise
   */
  send (id, message) {
    if (this._spray.livingOutview.has(id)) {
      return this._spray.send('receive', id, message, true)
    } else if (this._spray.livingInview.has(id)) {
      return this._spray.send('receive', id, message, false)
    } else {
      return Promise.reject(Errors.peerNotFound(id))
    }
  }

  /**
   * Return a list of neighbours' ids in our outview and inview
   * @example
   * f.getNeighbours() // {outview: ['a', 'b'], inview: ['c']}
   * @return {Object} {outview: [<string>...], inview: [<string>...]}
   */
  getNeighbours () {
    return this._spray.getNeighbours(true)
  }
}

module.exports = Spray
