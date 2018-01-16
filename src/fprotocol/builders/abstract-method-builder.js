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

const utils = require('../utils.js')

/**
 * Apply hooks on a message in reduce fashion.
 * Hooks may return a new message. If it's not the case, the previous message is used for the next reduce step.
 * @private
 * @param  {function[]} hooks - Set of hooks
 * @return {function} A function that apply the set of hooks to a message
 */
function reduceHooks (hooks) {
  return msg => {
    let tmp
    return hooks.reduce((prev, hook) => {
      tmp = hook(prev)
      if (tmp === undefined || tmp === null) { return prev }
      return tmp
    }, msg)
  }
}

/**
 * An AbstractBuilder defines an abstract class capable of builiding a service method.
 * It defines, in the prototype of a protocol subclass:
 * * The service method, used to send messages.
 * * The service handler, used to handle reception of messages for this service.
 * * The service hooks, executed before/after a message is sent/recevied.
 * @abstract
 * @author Thomas Minier
 */
class AbstractMethodBuilder {
  /**
   * Constructor
   * @param  {string} serviceName - The name of the service
   */
  constructor (serviceName) {
    this._serviceName = serviceName
    this._camelCasedName = utils.camelCase(this._serviceName)
    this._capitalizedCamelCase = utils.capitalize(this._camelCasedName)
  }

  get methodName () {
    return this._camelCasedName
  }

  get handlerName () {
    return `_${this._camelCasedName}`
  }

  get beforeSendName () {
    return `_beforeSend${this._capitalizedCamelCase}`
  }

  get beforeReceiveName () {
    return `_beforeReceive${this._capitalizedCamelCase}`
  }

  get afterSendName () {
    return `_afterSend${this._capitalizedCamelCase}`
  }

  get afterReceiveName () {
    return `_afterReceive${this._capitalizedCamelCase}`
  }

  /**
   * Build the service method used to send messages.
   * @param  {function} protocol - The protocol class
   * @return {void}
   */
  buildService (protocol) {
    throw new Error('A valid Builder must implement a valid buildService method')
  }

  /**
   * Build the service handler
   * @param  {function} protocol - The protocol class
   * @param  {function} handler  - The callback used when a message is received for this service
   * @return {void}
   */
  buildHandler (protocol, handler) {
    protocol.prototype[this.handlerName] = handler
  }

  /**
   * Build the before hooks for this service.
   * @param  {function} protocol - The protocol class
   * @param  {Object} beforeHooks - The hooks executed before a message is sent/received
   * @return {void}
   */
  buildBeforeHooks (protocol, beforeHooks) {
    if (beforeHooks.send.length > 0) { protocol.prototype[this.beforeSendName] = reduceHooks(beforeHooks.send) }
    if (beforeHooks.receive.length > 0) { protocol.prototype[this.beforeReceiveName] = reduceHooks(beforeHooks.receive) }
  }

  /**
   * Build the after hooks for this service.
   * @param  {function} protocol - The protocol class
   * @param  {Object} afterHooks - The hooks executed after a message is sent/received
   * @return {void}
   */
  buildAfterHooks (protocol, afterHooks) {
    if (afterHooks.send.length > 0) { protocol.prototype[this.afterSendName] = reduceHooks(afterHooks.send) }
    if (afterHooks.receive.length > 0) { protocol.prototype[this.afterReceiveName] = reduceHooks(afterHooks.receive) }
  }
}

module.exports = AbstractMethodBuilder
