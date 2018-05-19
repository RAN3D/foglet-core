/*
This broadcast implementation  is clearly inspired from https://github.com/Chat-Wane/CausalBroadcastDefinition
This is a causal broadcast customizable, if you want to specifiy
*/
'use strict'

const AbstractBroadcast = require('./../abstract/abstract-broadcast.js')
const VVwE = require('version-vector-with-exceptions') // Version-Vector With Exceptions
const messages = require('./messages.js')

const uuid = require('uuid/v4')
const sortedIndexBy = require('lodash.sortedindexby')
const debug = (require('debug'))('foglet-core:broadcast')

/**
 * Format the IDs of messages in string format
 * @param  {Obbject} message - The message to format
 * @return {string} The formatted message's id in string format
 */
function formatID (message) {
  return `e=${message.id.e}&c=${message.id.c}`
}

/**
 * Broadcast represent the base implementation of a broadcast protocol for the foglet library.
 * Based on the CausalBrodacastDefinition Package: see: https://github.com/Chat-Wane/CausalBroadcastDefinition
 * @extends AbstractBroadcast
 * @author Arnaud Grall (Folkvir)
 */
class Broadcast extends AbstractBroadcast {
  /**
   * Constructor
   * @param  {AbstractNetwork} source - The source RPS/overlay
   * @param  {string} protocol - The name of the broadcast protocol
   */
  constructor (source, protocol) {
    super(source, protocol)
    if (source && protocol) {
      this.options = {
        id: source._options.peer,
        delta: 1000 * 30
      }
      // the id is your id, base on the .PEER id in the RPS options
      this._causality = new VVwE(this.options.id)
      // buffer of received messages
      this._buffer = []
      // buffer of anti-entropy messages (chunkified because of large size)
      this._bufferAntiEntropy = messages.MAntiEntropyResponse('init')
    } else {
      return new Error('Not enough parameters', 'fbroadcast.js')
    }
  }

  /**
   * Send a message to all neighbours
   * @private
   * @param  {Object} message - The message to send
   * @return {void}
   */
  _sendAll (message) {
    const n = this._source.getNeighbours(Infinity)
    if (n.length > 0) n.forEach(p => this._unicast.send(p, message).catch(e => debug('Error: It seems there is not a receiver', e)))
  }

  /**
   * Send a message in broadcast
   * @param  {Object}  message  - The message to send
   * @param  {Object} [id] {e: <stringId>, c: <Integer>} this uniquely represents the id of the operation
   * @param  {Object} [isReady] {e: <stringId>, c: <Integer>} this uniquely represents the id of the operation that we must wait before delivering the message
   * @return {boolean}
   */
  send (message, id, isReady = undefined) {
    const a = id || this._causality.increment()
    const broadcastMessage = messages.BroadcastMessage(this._protocol, a, isReady, message)
    // #2 register the message in the structure
    this._causality.incrementFrom(a)

    // #3 send the message to the neighborhood
    this._sendAll(broadcastMessage)
    return a
  }

  /**
   * We started Antientropy mechanism in order to retreive old missed files
   */
  startAntiEntropy (delta = this.options.delta) {
    this._intervalAntiEntropy = setInterval(() => {
      this._source.getNeighbours().forEach(peer => this._unicast.send(peer, messages.MAntiEntropyRequest(this._causality)))
    }, delta)

    this.on('antiEntropy', (id, messageCausality, ourCausality) => this._defaultBehaviorAntiEntropy(id, messageCausality, ourCausality))
  }

  /**
   * This callback depends on the type of the applications, this is the default behavior when you receive old missed files
   */
  _defaultBehaviorAntiEntropy (id, messageCausality, ourCausality) {
    debug('(Warning) You should modify this, AntiEntropy default behavior: ', id, messageCausality, ourCausality)
  }

  /**
   * Clear the AntiEntropy mechanism
   */
  clearAntiEntropy () {
    if (this._intervalAntiEntropy) clearInterval(this._intervalAntiEntropy)
  }

  /**
   * Send entropy response
   * @deprecated
   * @param  {[type]} origin             [description]
   * @param  {[type]} causalityAtReceipt [description]
   * @param  {[type]} elements           [description]
   * @return {[type]}                    [description]
   */
  sendAntiEntropyResponse (origin, causalityAtReceipt, elements) {
    let id = uuid()
    // #1 metadata of the antientropy response
    let sent = this._unicast.send(origin, messages.MAntiEntropyResponse(id, causalityAtReceipt, elements.length))
    let i = 0
    while (sent && i < elements.length) {
      sent = this._unicast.send(origin, messages.MAntiEntropyResponse(id, null, elements.length, elements[i]))
      ++i
    }
  }

  /**
   * Handler executed when a message is recevied
   * @param  {string} id  - Message issuer's ID
   * @param  {Object} message - The message received
   * @return {void}
   */
  _receive (id, message) {
    // if not present, add the issuer of the message in the message
    if (!('issuer' in message)) { message.issuer = id }

    switch (message.type) {
      case 'MAntiEntropyRequest': {
        debug(id, message)
        this.emit('antiEntropy', id, message.causality, this._causality.clone())
        break
      }
      case 'MAntiEntropyResponse': {
      // #A replace the buffered message
        if (this._bufferAntiEntropy.id !== message.id) {
          this._bufferAntiEntropy = message
        }
        // #B add the new element to the buffer
        if (message.element) {
          this._bufferAntiEntropy.elements.push(message.element)
        }
        // #C add causality metadata
        if (message.causality) {
          this._bufferAntiEntropy.causality = message.causality
        }
        // #D the buffered message is fully arrived, deliver
        if (this._bufferAntiEntropy.elements.length ===
          this._bufferAntiEntropy.nbElements) {
        // #1 considere each message in the response independantly
          for (let i = 0; i < this._bufferAntiEntropy.elements.length; ++i) {
            let element = this._bufferAntiEntropy.elements[i]
            // #2 only check if the message has not been received yet
            if (!this._shouldStopPropagation(element)) {
              this._causality.incrementFrom(element.id)
              this.emit('receive', message.issuer, element.payload)
            }
          }
          // #3 merge causality structures
          this._causality.merge(this._bufferAntiEntropy.causality)
        }
        break
      }

      default: {
        if (!this._shouldStopPropagation(message)) {
        // #1 register the operation
        // maintain `this._buffer` sorted to search in O(log n)
          const index = sortedIndexBy(this._buffer, message, formatID)
          this._buffer.splice(index, 0, message)
          // #2 deliver
          this._reviewBuffer()
          // #3 rebroadcast
          this._sendAll(message)
        }
        break
      }
    }
  }

  /**
   * Check if a message should be propagated or not
   * @private
   * @param  {Object} message - The message to check
   * @return {boolean} True if the message should not be propagated, False if it should be.
   */
  _shouldStopPropagation (message) {
    return this._causality.isLower(message.id) || (this._findInBuffer(formatID(message)) >=0)
  }

  /**
   * Try to find the index of a message in the internal buffer
   * @private
   * @param  {string} id - Message's ID
   * @return {int} The index of the message in the buffer, or -1 if not found
   */
  _findInBuffer (id) {
    // use a binary search algorithm since `this._buffer` is sorted by IDs
    let minIndex = 0
    let maxIndex = this._buffer.length - 1
    let currentIndex, currentElement

    while (minIndex <= maxIndex) {
      currentIndex = (minIndex + maxIndex) / 2 | 0
      currentElement = formatID(this._buffer[currentIndex])

      if (currentElement < id) {
        minIndex = currentIndex + 1
      } else if (currentElement > id) {
        maxIndex = currentIndex - 1
      } else {
        return currentIndex
      }
    }
    return -1
  }

  /**
   * Scan internal buffer to deliver waiting messages
   * @private
   * @return {void}
   */
  _reviewBuffer () {
    let message
    let found = false
    for (let index = this._buffer.length - 1; index >= 0; --index) {
      message = this._buffer[index]
      if (this._causality.isLower(message.id)) {
        this._buffer.splice(index, 1)
      } else {
        // console.log(message, this._causality.isReady(message.isReady), this._causality);
        if (this._causality.isReady(message.isReady)) {
          found = true
          this._causality.incrementFrom(message.id)
          this._buffer.splice(index, 1)
          this.emit('receive', message.issuer, message.payload)
        }
      }
    }
    if (found) {
      this._reviewBuffer()
    }
  }
}

module.exports = Broadcast
