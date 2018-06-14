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

const Communication = require('../network/communication/communication.js')

/**
 * A ConsistencyCriteria represents an abstract consistency criteria
 * that controls how operations are applied to a shared object
 * @abstract
 * @author Thomas Minier
 */
class ConsistencyCriteria {
  /**
   * Constructor
   * @param {string}  objName     - The shared object name
   * @param {*}       localObject - Local copy of the shared object
   * @param {Foglet}  foglet      - Foglet used to access the network
   */
  constructor (objName, localObject, foglet) {
    this._objName = objName
    this._foglet = foglet
    this._localObject = localObject
    // use a dedicated communication channel for this shared object
    this._protocolName = `cods-shared-obj(name:${this._objName};obj:${this._localObject.name};cc:${this.name})`
    this._channel = new Communication(this._foglet.overlay(null), this._protocolName)
  }

  /**
   * Get the communication channel used to exchange messages with peers
   * @return {Communication} A communication channel dedicated to this shared object
   */
  get communication () {
    return this._channel
  }

  /**
   * Apply a 'query' operation to the shared object
   * @param  {string} opName    - Name of the operation invoked on the shared object
   * @param  {[]}     args      - Arguments passed to the operation
   * @return {*} Return value of the operation once invoked with the arguments
   */
  applyQuery (opName, args) {
    return this.localApply(opName, args)
  }

  /**
   * Apply an 'update' operation to the shared object
   * @param  {string} opName    - Name of the operation invoked on the shared object
   * @param  {[]}     args      - Arguments passed to the operation
   * @return {*} Return value of the operation once invoked with the arguments
   */
  applyUpdate (opName, args) {
    return this.localApply(opName, args)
  }

  /**
   * Apply an operation on the local object
   * @param  {string} operation - Name of the operation invoked
   * @param  {[]}     args      - Arguments passed to the operation
   * @return {*} Return value of the operation onece invoked with the arguments
   */
  localApply (operation, args) {
    this._localObject[operation].apply(this._localObject, ...args)
  }
}

module.exports = ConsistencyCriteria
