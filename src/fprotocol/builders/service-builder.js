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

const UnicastBuilder = require('./unicast-builder.js')
const BroadcastBuilder = require('./broadcast-builder.js')

/**
 * Error thrown when a service builder has an invalid configuration
 * @extends Error
 * @author Thomas Minier
 */
class ServiceBuildingError extends Error {}

/**
 * A ServiceBuilder build a service into the prototype of a protocol, including the service method, the handler & the possible hooks.
 * @author Thomas Minier
 */
class ServiceBuilder {
  /**
   * Constructor
   * @param  {string} serviceName - The name of the service
   */
  constructor (serviceName) {
    this._serviceName = serviceName
    this._builder = null
    this._handler = null
    this._beforeHooks = {
      send: [],
      receive: []
    }
    this._afterHooks = {
      send: [],
      receive: []
    }
  }

  /**
   * Helper used to define the type of the service.
   * @example
   * // define an unicast service
   * myService.is.unicast();
   * // define a broadcast service
   * myService.is.broadcast();
   * @return {Object}
   */
  get is () {
    return {
      unicast: () => { this._builder = new UnicastBuilder(this._serviceName) },
      broadcast: () => { this._builder = new BroadcastBuilder(this._serviceName) }
    }
  }

  /**
   * Helper used to define the callback invoked when a message is received for this service.
   * @example
   * myService.on.receive((msg, reply, reject) => {
   *  if (msg.number % 2 === 0)
   *    reply('You send an even number');
   *  else
   *    reject('You send a odd number!');
   * });
   * @return {Object}
   */
  get on () {
    return {
      receive: callback => { this._handler = callback }
    }
  }

  /**
   * Helper used to define hooks executed before a message is sent/received.
   * @example
   * // define a hook before a message is sent
   * mysService.before.send(msg => console.log(`You are going to send ${msg}`));
   *
   * // define a hook before a message is received
   * mysService.before.receive(msg => console.log(`You are about to receive ${msg}`));
   * @return {Object}
   */
  get before () {
    return {
      send: callback => this._beforeHooks.send.push(callback),
      receive: callback => this._beforeHooks.receive.push(callback)
    }
  }

  /**
   * Helper used to define hooks executed after a message is sent/received.
   * @example
   * // define a hook after a message is sent
   * mysService.after.send(msg => console.log(`You just send ${msg}`));
   *
   * // define a hook after a message is received
   * mysService.after.receive(msg => console.log(`You juste finished processing ${msg}`));
   * @return {Object}
   */
  get after () {
    return {
      send: callback => this._afterHooks.send.push(callback),
      receive: callback => this._afterHooks.receive.push(callback)
    }
  }

  /**
   * Apply the builder on a protocol subclass to build the service in it.
   * The builder must have been properly configured before calling this function, otherwise an error will be thrown.
   * A valid builder has a type and a handler set.
   * @param  {function} protocol - The protocol class
   * @return {void}
   */
  apply (protocol) {
    if (!this._validate()) { throw new ServiceBuildingError('') }
    this._builder.buildService(protocol)
    this._builder.buildHandler(protocol, this._handler)
    this._builder.buildBeforeHooks(protocol, this._beforeHooks)
    this._builder.buildAfterHooks(protocol, this._afterHooks)
  }

  /**
   * Validate the builder
   * @private
   * @return {boolean} true if the builder is valid, False otherwise
   */
  _validate () {
    return this._type !== null && this._handler !== null
  }
}

module.exports = ServiceBuilder
