/*
MIT License

Copyright (c) 2016-2017 Grall Arnaud

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
'use strict'

// const debug = require('debug')('foglet-core:communication');
const Unicast = require('./unicast/unicast.js')
const Broadcast = require('./broadcast/broadcast.js')
const MiddlewareRegistry = require('../../utils/middleware-registry.js')
// streams
const StreamRequest = require('./stream/stream-request.js')
const StreamMessage = require('./stream/stream-message.js')

/**
 * Communication is a facade to send messages to peers in a network using unicast or broadcast channels.
 * @author Grall Arnaud (Folkvir)
 */
class Communication {
  constructor (source, protocol) {
    this.network = source
    this.unicast = new Unicast(this.network, protocol)
    this.broadcast = new Broadcast(this.network, protocol)
    // channels used for streaming
    this._unicastStreams = new Unicast(this.network, `${protocol}-streams`)
    this._broadcastStreams = new Broadcast(this.network, `${protocol}-streams`)
    this._activeStreams = new Map()
    this._middlewares = new MiddlewareRegistry()
  }

  /**
   * Register a middleware, with an optional priority
   * @param  {Object} middleware   - The middleware to register
   * @param  {function} middleware.in - Function applied on middleware input
   * @param  {function} middleware.out - Function applied on middleware output
   * @param  {Number} [priority=0] - (optional) The middleware priority
   * @return {void}
   */
  use (middleware, priority = 0) {
    this._middlewares.register(middleware, priority)
  }

  /**
   * Send a message to a specified peer
   * @param  {string} id - Id of the peer
   * @param  {Object} message - Message to send
   * @return {Promise} Promise fulfilled when the message is sent
   */
  sendUnicast (id, message) {
    return this.unicast.send(id, this._middlewares.in(message))
  }

  /**
  * Begin the streaming of a message to another peer (using unicast)
  * @param  {string} id - Id of the peer
  * @return {StreamRequest} Stream used to transmit data to another peer
  * @example
  * const comm = getSomeCommunication();
  * const peerID = getSomePeerID();
  *
  * const stream = comm.streamUnicast(peerID);
  * stream.write('Hello');
  * stream.write(' world!');
  * stream.end();
  */
  streamUnicast (id) {
    return new StreamRequest(msg => {
      msg.payload = this._middlewares.in(msg.payload)
      this._unicastStreams.send(id, msg)
    })
  }

  /**
   * @todo Complete tests of this function
   * Send a message to multiple peers
   * @param  {string[]} ids - Array of ids to the send message
   * @param  {Object} message - Message to send
   * @return {Promise} Promise fulfilled when all message are sent
   */
  sendMulticast (ids, message) {
    return this.unicast.sendMultiple(ids, this._middlewares.in(message))
  }

  /**
  * Send a message to all peers using broadcast, (optionnal: specify uniq message id and the id to wait, see: broadcast.js)
  * @param  {Object} message - Message to broadcast over the network
  * @param  {Object} [id] {_e: <stringId>, _c: <Integer>} this uniquely represents the id of the operation
  * @param  {Object} [isReady] {_e: <stringId>, _c: <Integer>} this uniquely represents the id of the operation that we must wait before delivering the message
  * @return {Object}  id of the message sent
  */
  sendBroadcast (message, id, isReady = undefined) {
    return this.broadcast.send(this._middlewares.in(message), id, isReady)
  }

  /**
  * Begin the streaming of a message to all peers (using broadcast)
  * @param  {VersionVector} [isReady=undefined] - Id of the message to wait before this message is received
  * @return {StreamRequest} Stream used to transmit data to all peers
  * @example
  * const comm = getSomeCommunication();
  *
  * const stream = comm.sendBroadcast();
  * stream.write('Hello');
  * stream.write(' world!');
  * stream.end();
  */
  streamBroadcast (isReady = undefined) {
    return new StreamRequest((msg, id, isReady) => {
      msg.payload = this._middlewares.in(msg.payload)
      // console.log(msg, id, isReady, this._broadcastStreams._causality)
      return this._broadcastStreams.send(msg, id, isReady)
    }, isReady)
  }

  /**
  * Listen on incoming unicasted message
  * @param  {MessageCallback} callback - Callback invoked with the message
  * @return {void}
  */
  onUnicast (callback) {
    this.unicast.on('receive', (id, message) => {
      callback(id, this._middlewares.out(message))
    })
  }

  /**
  * Listen on incoming unicasted streams
  * @param  {MessageCallback} callback - Callback invoked with a {@link StreamMessage} as message
  * @return {void}
  * @example
  * const comm = getSomeCommunication();
  *
  * comm.onStreamUnicast((id, stream) => {
  *  console.log('a peer with id = ', id, ' is streaming data to me');
  *  stream.on('data', data => console.log(data));
  *  stream.on('end', () => console.log('no more data available from the stream'));
  * });
  */
  onStreamUnicast (callback) {
    this._unicastStreams.on('receive', (id, message) => this._handleStreamMessage(id, message, callback))
  }

  /**
  * Listen to an incoming unicasted message, and then remove the listener
  * @param  {MessageCallback} callback - Callback invoked with the message
  * @return {void}
  */
  onOnceUnicast (callback) {
    this.unicast.once('receive', (id, message) => {
      callback(id, this._middlewares.out(message))
    })
  }

  /**
   * Listen on broadcasted messages
   * @param  {MessageCallback} callback - Callback invoked with the message
   * @return {void}
   */
  onBroadcast (callback) {
    this.broadcast.on('receive', (id, message) => callback(id, this._middlewares.out(message)))
  }

  /**
  * Listen on incoming unicasted streams
  * @param  {MessageCallback} callback - Callback invoked with a {@link StreamMessage} as message
  * @return {void}
  * @example
  * const comm = getSomeCommunication();
  *
  * comm.onStreamBroadcast((id, stream) => {
  *  console.log('a peer with id = ', id, ' is streaming data to me');
  *  stream.on('data', data => console.log(data));
  *  stream.on('end', () => console.log('no more data available from the stream'));
  * });
  */
  onStreamBroadcast (callback) {
    this._broadcastStreams.on('receive', (id, message) => this._handleStreamMessage(id, message, callback))
  }

  /**
   * Listen to a broadcasted message, then remove the listener
   * @param  {MessageCallback} callback - Callback invoked with the message
   * @return {void}
   */
  onOnceBroadcast (callback) {
    this.broadcast.once('receive', (id, message) => callback(id, this._middlewares.out(message)))
  }

  /**
   * Remove all 'receive' unicast callback
   * @return {void}
   */
  removeAllUnicastCallback () {
    this.unicast.removeAllListeners('receive')
  }

  /**
   * Remove all 'receive' broadcast callback
   * @return {void}
   */
  removeAllBroacastCallback () {
    this.broadcast.removeAllListeners('receive')
  }

  /**
   * Handle an incoming stream message
   * @private
   * @param {string} id - The id of the peer who sent the message
   * @param {Object} message - The stream message to process
   * @param {function} callback - The callback associated with the stream message
   * @return {void}
   */
  _handleStreamMessage (id, message, callback) {
    // create responses objects for new streams
    if (!this._activeStreams.has(message.id)) {
      this._activeStreams.set(message.id, new StreamMessage())
      callback(id, this._activeStreams.get(message.id))
    }
    switch (message.type) {
      case 'chunk': {
        this._activeStreams.get(message.id).push(message.payload)
        break
      }
      case 'trailers': {
        if (!this._activeStreams.has(message.id)) { throw new Error(`Cannot add trailers to an unkown stream with id = ${message.id}`) }
        this._activeStreams.get(message.id)._trailers = message.payload
        break
      }
      case 'end': {
        this._closeStream(message.id)
        break
      }
      case 'error': {
        if (!this._activeStreams.has(message.id)) { throw new Error(`Cannot transmit an error to an unkown stream with id = ${message.id}`) }
        this._activeStreams.get(message.id).emit('error', message.payload)
        this._closeStream(message.id)
        break
      }
      default:
        throw new Error(`Unknown StreamMessage type found in incoming stream message: ${message.type}`)
    }
  }

  /**
   * Close an open stream
   * @private
   * @param {string} id - The ID of the stream to close
   * @return {void}
   */
  _closeStream (id) {
    if (!this._activeStreams.has(id)) { throw new Error(`Cannot close an unkown stream with id = ${id}`) }
    this._activeStreams.get(id).push(null)
    this._activeStreams.delete(id)
  }
}

module.exports = Communication
