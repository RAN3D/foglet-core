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

const camelCase = require('lodash/camelCase');
const snakeCase = require('lodash/snakeCase');

/**
 * Apply hooks on a message in reduce fashion.
 * Hooks may return a new message. If it's not the case, the previous message is used for the next reduce step.
 * @private
 * @param  {function[]} hooks - Set of hooks
 * @return {function} A function that apply the set of hooks to a message
 */
function reduceHooks (hooks) {
  return msg => {
    let tmp;
    return hooks.reduce((prev, hook) => {
      tmp = hook(prev);
      if (tmp === undefined || tmp === null)
        return prev;
      return tmp;
    }, msg);
  };
}

/**
 * An AbstractBuilder defines an abstract class capable of builiding a service.
 * It defines, in the prototype of a protocol subclass:
 * * The service method, used to send messages.
 * * The service handler, used to handle reception of messages for this service.
 * * The service hooks, executed before/after a message is sent/recevied.
 * @abstract
 * @author Thomas Minier
 */
class AbstractBuilder {
  /**
   * Constructor
   * @param  {string} serviceName - The name of the service
   */
  constructor (serviceName) {
    this._serviceName = serviceName;
    this._camelCasedName = camelCase(this._serviceName);
    this._snakedCasedName = snakeCase(this._serviceName);
  }

  /**
   * Build the service method used to send messages.
   * @param  {function} protocol - The protocol class
   * @return {void}
   */
  buildService (protocol) {
    throw new Error('A valid Builder must implement a valid buildService method'), protocol;
  }

  /**
   * Build the service handler
   * @param  {function} protocol - The protocol class
   * @param  {function} handler  - The callback used when a message is received for this service
   * @return {void}
   */
  buildHandler (protocol, handler) {
    protocol.prototype[`_${this._snakedCasedName}`] = handler;
  }

  /**
   * Build the before hooks for this service.
   * @param  {function} protocol - The protocol class
   * @param  {Object} beforeHooks - The hooks executed before a message is sent/received
   * @return {void}
   */
  buildBeforeHooks (protocol, beforeHooks) {
    if (beforeHooks.send.length > 0)
      protocol.prototype[`_beforeSend${this._camelCasedName}`] = reduceHooks(beforeHooks.send);
    if (beforeHooks.receive.length > 0)
      protocol.prototype[`_beforeReceive${this._camelCasedName}`] = reduceHooks(beforeHooks.receive);
  }

  /**
   * Build the after hooks for this service.
   * @param  {function} protocol - The protocol class
   * @param  {Object} afterHooks - The hooks executed after a message is sent/received
   * @return {void}
   */
  buildAfterHooks (protocol, afterHooks) {
    if (afterHooks.send.length > 0)
      protocol.prototype[`_afterSend${this._camelCasedName}`] = reduceHooks(afterHooks.send);
    if (afterHooks.receive.length > 0)
      protocol.prototype[`_afterReceive${this._camelCasedName}`] = reduceHooks(afterHooks.receive);
  }
}

module.exports = AbstractBuilder;
