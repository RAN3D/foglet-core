/* file : specification.js
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
 * Specify the 'query' operation of the shard object
 * @author Thomas Minier
 * @param  {function} descriptor - Shared object's Prototype
 * @param  {string[]} methods - Operations' names
 * @return {function} The Shared object's Prototype updated with the new specification
 */
function specifyQueries (descriptor, methods) {
  const proto = descriptor.prototype
  if (!('__cods' in proto)) {
    proto.__cods = {}
  }
  proto.__cods.query_operations = methods
  return descriptor
}

/**
 * Specify the 'update' operation of the shard object
 * @author Thomas Minier
 * @param  {function} descriptor - Shared object's Prototype
 * @param  {string[]} methods - Operations' names
 * @return {function} The Shared object's Prototype updated with the new specification
 */
function specifyUpdates (descriptor, methods) {
  const proto = descriptor.prototype
  if (!('__cods' in proto)) {
    proto.__cods = {}
  }
  proto.__cods.update_operations = methods
  return descriptor
}

/**
 * Specify the 'query' and 'update' operations of the shard object
 * @author Thomas Minier
 * @param  {function} descriptor - Shared object's Prototype
 * @param  {string[]} queries - Names of the 'query' operations
 * @param  {string[]} updates - Names of the 'update' operations
 * @return {function} The Shared object's Prototype updated with the new specification
 */
function specifyOperations (descriptor, queries, updates) {
  return specifyUpdates(specifyQueries(descriptor, queries), updates)
}

/**
 * Access the CODS specification of a shared object
 * @author Thomas Minier
 * @param  {*} instance - An instance of the shared object
 * @return {Object} The CODS specification of the shared object
 */
function getSpec (instance) {
  return Object.getPrototypeOf(instance).__cods
}

/**
 * Get the list of 'query' operations of a shared object
 * @author Thomas Minier
 * @param  {*} instance - An instance of the shared object to analyze
 * @param  {*} [defaultValue=[]] - Default return value if there no 'query' operations specified
 * @return {string[]} A list of the 'query' operations of the shared object
 */
function getQueryOperations (instance, defaultValue = []) {
  const spec = getSpec(instance)
  if (spec === undefined) {
    return defaultValue
  }
  return spec.query_operations
}

/**
 * Get the list of 'update' operations of a shared object
 * @author Thomas Minier
 * @param  {*} instance - An instance of the shared object to analyze
 * @param  {*} [defaultValue=[]] - Default return value if there no 'update' operations specified
 * @return {string[]} A list of the 'update' operations of the shared object
 */
function getUpdateOperations (instance, defaultValue = []) {
  const spec = getSpec(instance)
  if (spec === undefined) {
    return defaultValue
  }
  return spec.update_operations
}

module.exports = {
  getSpec,
  getQueryOperations,
  getUpdateOperations,
  specifyOperations
}
