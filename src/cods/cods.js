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

/**
 * [connect description]
 * @author Thomas Minier
 * @param  {string}              name        - Name of shared object
 * @param  {Foglet}              foglet      - Foglet used to access the network
 * @param  {ConsistencyCriteria} Criteria    - Consistency criteria to use
 * @param  {*}                   localObject - Local object to transform into a shared object
 * @return {*} The corresponding shared object
 */
function connect (name, foglet, criteria, localObject) {
  return SharedObjectProxy.build(criteria, localObject)
}

module.exports = connect
