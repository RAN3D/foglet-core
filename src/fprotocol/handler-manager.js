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
'use strict';

/**
 * HandlerManager manage protocol handlers, i.e. forward messages to the correct handlers.
 * It also generates the reply & reject helpers.
 * @author Thomas Minier
 */
class HandlerManager {
  /**
   * Constructor
   * @param {FogletProtcol} protocol - The protocol on which handlers must be registered
   */
  constructor (protocol) {
    this._protocol = protocol;
    this._unicastHandlers = new Map();
    this._broadcastHandlers = new Map();
    this._unicastHandlers.set('foglet-protocol/service-answers/reply', '_answerReply');
    this._unicastHandlers.set('foglet-protocol/service-answers/reject', '_answerReject');
  }

  /**
   * Initiliaze the mananger and connect handlers
   * @return {void}
   */
  init () {
    this._protocol._foglet.onUnicast((id, msg) => this._handleUnicast(id, msg));
    this._protocol._foglet.onBroadcast(msg => this._handleBroadcast(msg));
  }

  /**
   * Register a handler for an unicast message
   * @param {string} name - The service's name
   * @param {string} handlerName - The name of the handler, i.e. the name of a protocol's method
   * @return {void}
   */
  registerUnicastHandler (name, handlerName) {
    if (!(handlerName in this._protocol))
      throw new SyntaxError(`The handler '${handlerName}' is not defined in the prototype of the protocol ${this.protocol._name}`);
    this._unicastHandlers.set(name, handlerName);
  }

  /**
   * Register a handler for a broadcast message
   * @param {string} name - The service's name
   * @param {string} handlerName - The name of the handler, i.e. the name of a protocol's method
   * @return {void}
   */
  registerBroadcastHandler (name, handlerName) {
    if (!(handlerName in this._protocol))
      throw new SyntaxError(`The handler '${handlerName}' is not defined in the prototype of the protocol ${this.protocol._name}`);
    this._broadcastHandlers.set(name, handlerName);
  }

  /**
   * Handle the reception of an unicast message
   * @private
   * @param {string} senderID - ID of the peer who send the message
   * @param {Object} msg - The message received
   * @return {void}
   */
  _handleUnicast (senderID, msg) {
    const msgType = `${msg.protocol}/${msg.method}`;
    if (this._unicastHandlers.has(msgType)) {
      const handlerName = this._unicastHandlers.get(msgType);
      // do not generate helpers for message emitted through the reply & reject helpers
      if (msgType !== 'foglet-protocol/service-answers') {
        const reply = value => {
          this._protocol._foglet.sendUnicast({
            protocol: 'foglet-protocol',
            method: 'service-answers/reply',
            payload: {
              answerID: msg.answerID,
              value
            }
          }, senderID);
        };
        const reject = value => {
          this._protocol._foglet.sendUnicast({
            protocol: 'foglet-protocol',
            method: 'service-answers/reject',
            payload: {
              answerID: msg.answerID,
              value
            }
          }, senderID);
        };
        this._protocol[handlerName](msg.payload, reply, reject);
      } else {
        this._protocol[handlerName](msg.payload);
      }
    }
  }

  /**
   * Handle the reception of a broadcast message
   * @private
   * @param {Object} msg - The message received
   * @return {void}
   */
  _handleBroadcast (msg) {
    const msgType = `${msg.protocol}/${msg.method}`;
    if (this._broadcastHandlers.has(msgType)) {
      const handlerName = this._broadcastHandlers.get(msgType);
      this._protocol[handlerName](msg.payload);
    }
  }
}

module.exports = HandlerManager;
