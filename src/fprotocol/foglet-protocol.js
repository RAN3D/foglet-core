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

const AnswerQueue = require('./answer-queue.js')
const utils = require('./utils.js')

/**
 * FogletProtocol represent an abstract protocol.
 * A Protocol is a a set of behaviours used to interact with others foglet that shares the same protocol.
 * @abstract
 * @author Thomas Minier
 */
class FogletProtocol {
  /**
   * Constructor
   * @param  {string} name   - The protocol's name
   * @param  {Foglet} foglet - The Foglet instance used by the protocol to communicate
   * @param  {...*} args - Additional arguments passed down to the `_init` function
   */
  constructor (name, foglet, ...args) {
    this._name = name
    this._foglet = foglet
    this._answerQueue = new AnswerQueue()
    this._initHandlers()
    if ('_init' in this) { this._init(...args) }
  }

  /**
   * Helper to send a unicast message
   * @private
   * @param  {string} id  - ID of the peer to which the message should be sent
   * @param  {*} msg  - The message to send
   * @param  {function} resolve - Function used to resolve a related promise when an answer to the message is received
   * @param  {function} reject  - Function used to reject a related promise when an answer to the message is received
   * @return {void}
   */
  _sendUnicast (id, msg, resolve, reject) {
    this._foglet.sendUnicast(id, this._answerQueue.stamp(msg, resolve, reject))
  }

  /**
   * Helper to send a broadcast message
   * @private
   * @param  {*} msg  - The message to send
   * @return {void}
   */
  _sendBroadcast (msg) {
    this._foglet.sendBroadcast(msg)
  }

  /**
   * Handler which resolve answers to messages
   * @private
   * @param {string} id - Sender's id
   * @param {Object} msg - Answer received
   * @return{void}
   */
  _answerReply (id, msg) {
    this._answerQueue.resolve(msg.answerID, msg.value)
  }

  /**
   * Handler which reject answers to messages
   * @private
   * @param {string} id - Sender's id
   * @param {Object} msg - Answer received
   * @return{void}
   */
  _answerReject (id, msg) {
    this._answerQueue.reject(msg.answerID, msg.value)
  }

  /**
   * Initialize the reception of messages from unicast & broadcast channels
   * @private
   * @return {void}
   */
  _initHandlers () {
    this._foglet.onUnicast((id, msg) => this._handleUnicast(id, msg))
    this._foglet.onBroadcast((id, msg) => this._handleBroadcast(id, msg))
  }

  /**
   * Handle the reception of an unicast message
   * @private
   * @param {string} senderID - ID of the peer who send the message
   * @param {Object} msg - The message received
   * @return {void}
   */
  _handleUnicast (senderID, msg) {
    const handlerName = utils.handlerName(msg.method)
    if (this._name === msg.protocol && handlerName in this) {
      // apply before hooks
      const beforeReceive = utils.beforeReceiveName(msg.method)
      if (beforeReceive in this) { msg.payload = this[beforeReceive](msg.payload) }
      // do not generate helpers for message emitted through the reply & reject helpers
      if (msg.method !== 'answerReply' || msg.method !== 'answerReject') {
        const reply = value => {
          this._sendUnicast(senderID, {
            protocol: this._name,
            method: 'answerReply',
            payload: {
              answerID: msg.answerID,
              value
            }
          })
        }
        const reject = value => {
          this._sendUnicast(senderID, {
            protocol: this._name,
            method: 'answerReject',
            payload: {
              answerID: msg.answerID,
              value
            }
          })
        }
        this[handlerName](senderID, msg.payload, reply, reject)
      } else {
        this[handlerName](senderID, msg.payload)
      }
      // apply after receive hook
      const afterReceive = utils.afterReceiveName(msg.method)
      if (afterReceive in this) { this[afterReceive](msg.payload) }
    }
  }

  /**
   * Handle the reception of a broadcast message
   * @private
   * @param {string} senderID - ID of the peer who send the message
   * @param {Object} msg - The message received
   * @return {void}
   */
  _handleBroadcast (senderID, msg) {
    const handlerName = utils.handlerName(msg.method)
    if (this._name === msg.protocol && handlerName in this) {
      // apply before hooks
      const beforeReceive = utils.beforeReceiveName(msg.method)
      if (beforeReceive in this) { msg.payload = this[beforeReceive](msg.payload) }
      // call handler
      this[handlerName](senderID, msg.payload)
      // apply after receive hook
      const afterReceive = utils.afterReceiveName(msg.method)
      if (afterReceive in this) { this[afterReceive](msg.payload) }
    }
  }
}

module.exports = FogletProtocol
