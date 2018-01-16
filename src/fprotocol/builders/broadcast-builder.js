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

const AbstractMethodBuilder = require('./abstract-method-builder.js')

/**
 * A builder specialized for broadcast services
 * @extends AbstractMethodBuilder
 * @author Thomas Minier
 */
class BroadcastBuilder extends AbstractMethodBuilder {
  /**
   * Build the service method used to send messages.
   * @override
   * @param  {function} protocol - The protocol class
   * @return {void}
   */
  buildService (protocol) {
    const method = this.methodName
    const beforeSendHook = this.beforeSendName
    const afterSendHook = this.afterSendName
    protocol.prototype[method] = function (payload) {
      const self = this
      if (beforeSendHook in self) { payload = self[beforeSendHook](payload) }
      const msg = {
        protocol: self._name,
        method,
        payload
      }
      self._sendBroadcast(msg)
      if (afterSendHook in self) { self[afterSendHook](payload) }
    }
  }
}

module.exports = BroadcastBuilder
