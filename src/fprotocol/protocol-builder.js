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

const compact = require('lodash/compact');
const FogletProtocol = require('./foglet-protocol.js');
const ServiceBuilder = require('./service-builder.js');

/**
 * Create a function that evaluates a tagged template to create a new subclass of {@link FogletProtocol}
 * that implements the protocol described in the template.
 * @param  {string} protocolName - The name of the protocol
 * @return {Prototype}
 */
function define (protocolName) {
  return function (services, ...callbacks) {
    let builder;
    const protocolClass = class extends FogletProtocol {
      constructor (foglet) {
        super(protocolName, foglet);
      }
    };
    // clean services names before building
    compact(services.map(str => str.trim()))
    .forEach((name, index) => {
      builder = new ServiceBuilder(name);
      callbacks[index](builder);
      builder.apply(protocolClass);
    });
    return protocolClass;
  };
}

module.exports = define;
