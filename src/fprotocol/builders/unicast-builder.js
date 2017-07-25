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

const AbstractBuilder = require('./abstract-builder.js');

/**
 * A builder specialized for unicast services
 * @extends AbstractBuilder
 * @author Thomas Minier
 */
class UnicastBuilder extends AbstractBuilder {

  /**
   * Build the service method used to send messages.
   * @override
   * @param  {function} protocol - The protocol class
   * @return {void}
   */
  buildService (protocol) {
    protocol.prototype[this._snakedCasedName] = function (id, payload) {
      const self = this;
      return new Promise(function (resolve, reject) {
        const msg = {
          protocol: self._name,
          method: this._serviceName,
          payload
        };
        self._foglet.sendUnicast(self._answerQueue.stamp(msg, resolve, reject), id);
      });
    };
  }
}

module.exports = UnicastBuilder;
