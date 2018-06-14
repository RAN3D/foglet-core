/* file : consistency-criteria.js
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

/**
 * A ConsistencyCriteria represents an abstract consistency criteria
 * @abstract
 * @author Thomas Minier
 */
class ConsistencyCriteria {
  /**
   * Constructor
   * @param {Foglet} foglet - Foglet used to access the network
   */
  constructor (foglet) {
    this._foglet = foglet
  }

  /**
   * Get the foglet associated with the shared object
   * @return {Foglet} The foglet associated with the shared object
   */
  get foglet () {
    return this._foglet
  }

  /**
   * Apply a 'query' operation to the shared object
   * @param  {*} localObject    - Local copy of the shared object
   * @param  {string} opName    - Name of the operation invoked on the shared object
   * @param  {[]}     args      - Arguments passed to the operation
   * @return {*} Return value of the operation once invoked with the arguments
   */
  applyQuery (localObject, opName, args, type) {
    throw new Error('A valid ConsistencyCriteria must implements an "applyQuery" method')
  }

  /**
   * Apply an 'update' operation to the shared object
   * @param  {*} localObject    - Local copy of the shared object
   * @param  {string} opName    - Name of the operation invoked on the shared object
   * @param  {[]}     args      - Arguments passed to the operation
   * @return {*} Return value of the operation once invoked with the arguments
   */
  applyUpdate (localObject, opName, args, type) {
    throw new Error('A valid ConsistencyCriteria must implements an "applyUpdate" method')
  }

  /**
   * Apply an operation on the local object
   * @param  {string} operation - Name of the operation invoked
   * @param  {[]}     args      - Arguments passed to the operation
   * @return {*} Return value of the operation onece invoked with the arguments
   */
  localApply (localObject, operation, args) {
    localObject[operation].apply(localObject, ...args)
  }
}

module.exports = ConsistencyCriteria
