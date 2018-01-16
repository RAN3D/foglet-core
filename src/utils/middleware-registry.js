/*
MIT License

Copyright (c) 2016 Grall Arnaud

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

/**
 * A Middleware registry coordintaes middleware in a foglet application
 * @author Thomas Minier
 */
class MiddlewareRegistry {
  /**
   * Constructor
   */
  constructor () {
    this._middlewares = []
  }

  /**
   * Register a middleware, with an optional priority
   * @param  {Object} middleware   - The middleware to register
   * @param  {function} middleware.in - Function applied on middleware input
   * @param  {function} middleware.out - Function applied on middleware output
   * @param  {Number} [priority=0] - (optional) The middleware priority
   * @return {void}
   */
  register (middleware, priority = 0) {
    if (!('in' in middleware) && !('out' in middleware)) { throw new Error('A middleware must contains two functions: "in" and "out"') }
    this._middlewares.push({
      middleware,
      priority
    })
    this._middlewares.sort((x, y) => x.priority - y.priority)
  }

  /**
   * Apply middleware on input data
   * @param  {*} data - Input data
   * @return {*} Input data transformed by successive application of middlewares
   */
  in (data) {
    let temp
    return this._middlewares.reduce((input, obj) => {
      temp = obj.middleware.in(input)
      if (temp !== undefined || temp !== null) { return temp }
      return input
    }, data)
  }

  /**
   * Apply middleware on output data
   * @param  {*} data - Output data
   * @return {*} Output data transformed by successive application of middlewares
   */
  out (data) {
    let temp
    return this._middlewares.reduce((input, obj) => {
      temp = obj.middleware.out(input)
      if (temp !== undefined || temp !== null) { return temp }
      return input
    }, data)
  }
}

module.exports = MiddlewareRegistry
