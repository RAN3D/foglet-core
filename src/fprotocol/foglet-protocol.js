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

const uuid = require('uuid/v4');

/**
 * FogletProtcol represent an abstract protocol.
 *
 * A Protocol is a a set of behaviours used to interact with others foglet that shares the same protocol.
 * It contains:
 * * rules, i.e. anonymous functions, to execute when receving specific message (by unicast and/or broadcast)
 * *
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
    this._unicastHandlers = new Map();
    this._broadcastHandlers = new Map();
    this._answerQueue = new Map();
    // register handler for answers
    this._unicastHandlers.set('foglet-protocol/service-answers', '_answer');
    // this._unicastHandlers.set('foglet-protocol/service-answers', msg => {
    //   if (this._answerQueue.has(msg.answerID)) {
    //     const answer = this._answerQueue.get(msg.answerID);
    //     if (msg.type === 'reply') {
    //       answer.resolve(msg.payload);
    //     } else if (msg.type === 'reject') {
    //       answer.reject(msg.payload);
    //     }
    //     this._answerQueue.delete(msg.answerID);
    //   }
    // });
    this._buildProtocol();
    this._enableHandlers();
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

  _answer (msg) {
    if (this._answerQueue.has(msg.answerID)) {
      const answer = this._answerQueue.get(msg.answerID);
      if (msg.type === 'reply') {
        answer.resolve(msg.value);
      } else if (msg.type === 'reject') {
        answer.reject(msg.value);
      }
      this._answerQueue.delete(msg.answerID);
    }
  }

  /**
   * Build protocol services
   * @private
   * @return {void}
   */
  _buildProtocol () {
    // TODO refactor to reduce code duplicata in this method
    this._unicast().forEach(method => {
      this._registerService(method, (id, payload) => {
        return new Promise((resolve, reject) => {
          const answerID = this._registerAnswer(resolve, reject);
          this._foglet.sendUnicast({
            protocol: this._name,
            method,
            payload,
            answerID
          }, id);
        });
      }, this._unicastHandlers);
    });

    // do the same for broadcast service
    this._broadcast().forEach(method => {
      this._registerService(method, payload => {
        return new Promise((resolve, reject) => {
          const answerID = this._registerAnswer(resolve, reject);
          this._foglet.sendBroadcast({
            protocol: this._name,
            method,
            payload,
            answerID
          });
        });
      }, this._broadcastHandlers);
    });
  }

  /**
   * Register a service
   * @private
   * @param  {string} serviceName   - The service name
   * @param  {function} serviceMethod - The method called by the service
   * @param  {Map} handlers - The collection in hwihc the serrvice handler must be registered
   * @return {void}
   */
  _registerService (serviceName, serviceMethod, handlers) {
    const handlerName = `_${serviceName}`;
    if (serviceName in this)
      throw new SyntaxError(`Cannot create a new service for protocol ${this._name} if the method ${serviceName} is already defined`);
    this[serviceName] = serviceMethod;
    // register handler
    if (!(handlerName in this))
      throw new SyntaxError(`The handler '${handlerName}' is not defined in the prtotype of the protocol ${this._name}`);
    handlers.set(`${this._name}/${serviceName}`, handlerName);
  }


  _registerAnswer (resolve, reject) {
    const answerID = uuid();
    this._answerQueue.set(answerID, { resolve, reject });
    return answerID;
  }

  /**
   * Setup handlers to process incoming messages
   * @private
   * @return {void}
   */
  _enableHandlers () {
    const handleMessage = (msg, handlers, senderID = null) => {
      const msgType = `${msg.protocol}/${msg.method}`;
      if (handlers.has(msgType)) {
        const handlerName = handlers.get(msgType);
        if (senderID !== null && msgType !== 'foglet-protocol/service-answers') {
          const reply = value => {
            console.log(msg.answerID);
            this._foglet.sendUnicast({
              protocol: 'foglet-protocol',
              method: 'service-answers',
              payload: {
                type: 'reply',
                answerID: msg.answerID,
                value
              }
            }, senderID);
          };
          const reject = value => {
            this._foglet.sendUnicast({
              protocol: 'foglet-protocol',
              method: 'service-answers',
              payload: {
                type: 'reject',
                answerID: msg.answerID,
                value
              }
            }, senderID);
          };
          this[handlerName](msg.payload, reply, reject);
        } else {
          this[handlerName](msg.payload);
        }
      }
    };
    this._foglet.onUnicast((id, msg) => handleMessage(msg, this._unicastHandlers, id));
    this._foglet.onBroadcast(msg => handleMessage(msg, this._broadcastHandlers));
  }
}

module.exports = FogletProtocol;
