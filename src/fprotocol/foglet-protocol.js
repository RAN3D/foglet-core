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
const HandlerManager = require('./handler-manager.js');

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
 */
class FogletProtocol {
  /**
   * Constructor
   * @param  {string} name   - The protocol's name
   * @param  {Foglet} foglet - The Foglet instance used by the protocol to communicate
   */
  constructor (name, foglet) {
    this._name = name;
    this._foglet = foglet;
    this._handlerManager = new HandlerManager(this);
    this._answerQueue = new AnswerQueue();
    this._buildProtocol();
    this._handlerManager.init();
  }

  /**
   * Returns the names of unicast services offered by this protocol.
   *
   * This method must be implemented by protocol developpers to specificy their protocol.
   * @return {string[]} The names of unicast services offered by this protocol
   */
  _unicast () {
    return [];
  }

  /**
   * Returns the names of broadcast services offered by this protocol.
   *
   * This method must be implemented by protocol developpers to specificy their protocol.
   * @return {string[]} The names of broadcast services offered by this protocol
   */
  _broadcast () {
    return [];
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

  /**
   * Build protocol services
   * @private
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
