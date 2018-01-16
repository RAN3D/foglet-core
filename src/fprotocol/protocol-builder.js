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

const FogletProtocol = require('./foglet-protocol.js')
const ServiceBuilder = require('./builders/service-builder.js')
const InitBuilder = require('./builders/init-builder.js')

/**
 * Create a function that evaluates a tagged template to create a new subclass of {@link FogletProtocol}
 * that implements the protocol described in the template.
 * @param  {string} protocolName - The name of the protocol
 * @return {function} A function that evaluates a tagged template to create a new subclass of {@link FogletProtocol}
 * @example
 * const ExampleUnicastProtocol = defineProtocol('example-unicast-protocol')`
 *  init
 *  ${function (base) {
 *    this._base = base;
 *  }}
 *  get
 *  ${function(service) {
 *    service.is.unicast();
 *    service.on.receive(function (id, msg, reply, reject) {
 *      if (msg.number % this._base === 0)
 *        reply(`${msg.number} is a multiple of ${this._base}`);
 *      else
 *        reject(`${msg.number} is not a multiple of ${this._base}`);
 *    });
 *  }}
 *  `;
 *
 * module.exports = ExampleUnicastProtocol;
 */
function define (protocolName) {
  return function (services, ...callbacks) {
    let builder
    const protocolClass = class extends FogletProtocol {
      constructor (foglet, ...args) {
        super(protocolName, foglet, ...args)
      }
    }
    // clean services names before building
    services.map(str => str.trim())
      .filter(str => str.length > 0)
      .forEach((name, index) => {
        if (name === 'init' || name === 'constructor') {
          builder = new InitBuilder(callbacks[index])
        } else {
          builder = new ServiceBuilder(name)
          callbacks[index](builder)
        }
        builder.apply(protocolClass)
      })
    return protocolClass
  }
}

module.exports = define
