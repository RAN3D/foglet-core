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

const AnswerQueue = require('./answer-queue.js');
// const HandlerManager = require('./handler-manager.js');

/**
 * FogletProtocol represent an abstract protocol.
 * A Protocol is a a set of behaviours used to interact with others foglet that shares the same protocol.
 *
 * One can define a new protocol by subclassing {@link FogletProtocol} and implementing the following methods:
 * * `unicast` to define the unicast services offered by the protocol.
 * * `broadcast` to define the broadcast services offered by the protocol.
 * Once these methods have been implemented, you need to implement a `handler method` per service offered.
 * A handler is a method of the subclass where its name is the name of the related service prefixed with `_`.
 * For example, a service **get** requires to define a method named **_get** in the subclass.
 * @abstract
 * @author Thomas Minier
 * @example
 * class SimpleUnicastProtocol extends FogletProtocol {

   _unicast () {
     return [ 'get' ];
   }

   _get (msg, reply, reject) {
     if (msg.number % 2 === 0)
        reply('you send an event number');
     else
        reject('you send an event number, it is not good!!!');
   }
 }
 */
class FogletProtocol {
  /**
   * Constructor
   * @param  {string} name   - The protocol's name
   * @param  {Foglet} foglet - The Foglet instance used by the protocol to communicate
   * @param  {...*} args - Additional arguments passed down to the `_init` function
   */
  constructor (name, foglet, ...args) {
    this._name = name;
    this._foglet = foglet;
    // this._handlerManager = new HandlerManager(this);
    this._answerQueue = new AnswerQueue();
    this._initHandlers();
    if ('_init' in this)
      this._init(this, ...args);
  }

  _sendUnicast (id, msg, resolve, reject) {
    this._foglet.sendUnicast(this._answerQueue.stamp(msg, resolve, reject), id);
  }

  _sendBroadcast (msg) {
    this._foglet.sendBroadcast(msg);
  }

  /**
   * Handler which resolve answers to messages
   * @private
   * @param {Object} msg - Answer received
   * @return{void}
   */
  _answerReply (msg) {
    this._answerQueue.resolve(msg.answerID, msg.value);
  }

  /**
   * Handler which reject answers to messages
   * @private
   * @param {Object} msg - Answer received
   * @return{void}
   */
  _answerReject (msg) {
    this._answerQueue.reject(msg.answerID, msg.value);
  }

  _initHandlers () {
    this._foglet.onUnicast((id, msg) => this._handleUnicast(id, msg));
    this._foglet.onBroadcast((msg, id) => this._handleBroadcast(msg, id));
  }

  /**
   * Handle the reception of an unicast message
   * @private
   * @param {string} senderID - ID of the peer who send the message
   * @param {Object} msg - The message received
   * @return {void}
   */
  _handleUnicast (senderID, msg) {
    const handlerName = `_${msg.method}`;
    if (this._name === msg.protocol && handlerName in this) {
      // do not generate helpers for message emitted through the reply & reject helpers
      if (msg.method !== 'answerReply' || msg.method !== 'answerReject') {
        const reply = value => {
          this._foglet.sendUnicast({
            protocol: 'foglet-protocol',
            method: 'answerReply',
            payload: {
              answerID: msg.answerID,
              value
            }
          }, senderID);
        };
        const reject = value => {
          this._foglet.sendUnicast({
            protocol: 'foglet-protocol',
            method: 'answerReject',
            payload: {
              answerID: msg.answerID,
              value
            }
          }, senderID);
        };
        this[handlerName].call(this, senderID, msg.payload, reply, reject);
      } else {
        this[handlerName].call(this, senderID, msg.payload);
      }
    }
  }

  /**
   * Handle the reception of a broadcast message
   * @private
   * @param {Object} msg - The message received
   * @param {string} senderID - ID of the peer who send the message
   * @return {void}
   */
  _handleBroadcast (msg, senderID) {
    const handlerName = `_${msg.method}`;
    if (this._name === msg.protocol && handlerName in this) {
      this[handlerName].call(this, senderID, msg.payload);
    }
  }

  /**
   * Build protocol services
   * @private
   * @deprecated
   * @return {void}
   */
  _buildProtocol () {
    // register unicast services
    this._unicast().forEach(method => {
      this._registerService(method, (id, payload) => {
        return new Promise((resolve, reject) => {
          const msg = {
            protocol: this._name,
            method,
            payload
          };
          this._foglet.sendUnicast(this._answerQueue.stamp(msg, resolve, reject), id);
        });
      });
      this._handlerManager.registerUnicastHandler(`${this._name}/${method}`, `_${method}`);
    });

    // do the same for broadcast service
    this._broadcast().forEach(method => {
      this._registerService(method, payload => {
        return new Promise((resolve, reject) => {
          const msg = {
            protocol: this._name,
            method,
            payload
          };
          this._foglet.sendBroadcast(this._answerQueue.stamp(msg, resolve, reject));
        });
      });
      this._handlerManager.registerBroadcastHandler(`${this._name}/${method}`, `_${method}`);
    });
  }

  /**
   * Register a service
   * @private
   * @deprecated
   * @param  {string} serviceName   - The service name
   * @param  {function} serviceMethod - The method called by the service
   * @return {void}
   */
  _registerService (serviceName, serviceMethod) {
    if (serviceName in this)
      throw new SyntaxError(`Cannot create a new service for protocol ${this._name} if the method ${serviceName} is already defined`);
    this[serviceName] = serviceMethod;
  }
}

module.exports = FogletProtocol;
