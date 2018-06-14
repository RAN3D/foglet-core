/* file : shared-object-proxy.js
MIT License

Copyright (c) 2018 Thomas Minier

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

const { getQueryOperations, getUpdateOperations } = require('./specification.js')

/**
 * A SharedObjectProxy proxy a shared object and delegates the execute of its 'query' and 'update' operation
 * to a consistency criteria
 * @author Thomas Minier
 */
class SharedObjectProxy {
  /**
   * Constructor
   * @param {*} localObject   - Shared object to proxy
   * @param {ConsistencyCriteria} criteria - Consistency criteria used to resolve operations
   */
  constructor (localObject, criteria) {
    this._localObject = localObject
    this._criteria = criteria
    this._queryOperations = getQueryOperations(localObject)
    this._updateOperations = getUpdateOperations(localObject)
  }

  /**
   * Build a new method proxy from a shared object and a consistency criteria
   * @param  {*} localObject - Shared object to proxy
   * @param  {ConsistencyCriteria} criteria - Consistency criteria used to resolve operations
   * @return {Proxy} A proxy configured with the shared object and the consistency criteria
   */
  static build (localObject, criteria) {
    const handler = new SharedObjectProxy(localObject, criteria)
    return new Proxy(localObject, handler)
  }

  /**
   * Handler use to resolve methods
   * @private
   * @param  {function} target  - Shared object
   * @param  {string} propKey   - property accessed
   * @param  {function} receiver - Proxy object
   * @return {function} Property/method to be called
   */
  get (target, propKey, receiver) {
    const self = this
    if (this._queryOperations.indexOf(propKey) > -1) {
      return function (...args) {
        return self._criteria.applyQuery(propKey, args)
      }
    } else if (this._updateOperations.indexOf(propKey) > -1) {
      return function (...args) {
        return self._criteria.applyUpdate(propKey, args)
      }
    }
    return Reflect.get(target, propKey, receiver)
  }
}

module.exports = SharedObjectProxy
