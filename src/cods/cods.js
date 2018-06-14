/* file : cods.js
MIT License

Copyright (c) 2018 Grall Arnaud

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

const SharedObjectProxy = require('./shared-object-proxy.js')
const { specifyOperations } = require('./specification.js')
const ConsistencyCriteria = require('./consistency-criteria.js')
const PipelineConsistency = require('./criterias/pipeline-consistency.js')

/**
 * Connect a Shared object to the network
 * @author Thomas Minier
 * @param  {string}   name        - Name of shared object
 * @param  {Foglet}   foglet      - Foglet used to access the network
 * @param  {function} Criteria    - Constructor of the consistency criteria to use
 * @param  {*}        localObject - Local object to transform into a shared object
 * @return {*} The corresponding shared object
 * @example
 * 'use strict'
 *
 * const { connect, UC, specifyOperations } = require('foglet').cods
 *
 * // A Shared register
 * class Register {
 *  constructor () {
 *    this._value = null
 *  }
 *
 *  read () { return this._value }
 *
 *  write (x) { this._value = x}
 * }
 *
 * // specificy that 'read' is a 'query' operation
 * // and 'write' is an 'update' operation
 * specifyOperations(Register, ['read'], ['write'])
 *
 *
 * // connect the shared object on the network
 * const foglet = getSomeFoglet()
 * const r1 = connect('r1', foglet, UC, new Register())
 *
 * console.log(r1.read())
 * r1.write('moo')
 * console.log(r1.read())
 */
function connect (name, foglet, Criteria, localObject) {
  const criteria = new Criteria(name, localObject, foglet)
  return SharedObjectProxy.build(localObject, criteria)
}

module.exports = {
  ConsistencyCriteria,
  connect,
  specifyOperations,
  PC: PipelineConsistency
}
