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

const camelCase = str => {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) => {
    return index === 0 ? letter.toLowerCase() : letter.toUpperCase()
  }).replace(/\s+/g, '')
}

const capitalize = str => {
  return str[0].toUpperCase() + str.slice(1)
}

/**
 * Get the name of a service method
 * @private
 */
const methodName = method => {
  return camelCase(method)
}

/**
 * Get the name of a handler
 * @private
 */
const handlerName = method => {
  return `_${camelCase(method)}`
}

/**
 * Get the name of a before hook for a service method
 * @private
 */
const beforeSendName = method => {
  return `_beforeSend${capitalize(camelCase(method))}`
}

/**
 * Get the name of a before hook for a handler
 * @private
 */
const beforeReceiveName = method => {
  return `_beforeReceive${capitalize(camelCase(method))}`
}

/**
 * Get the name of a before hook for a service method
 * @private
 */
const afterSendName = method => {
  return `_afterSend${capitalize(camelCase(method))}`
}

/**
 * Get the name of an after hook for a handler
 * @private
 */
const afterReceiveName = method => {
  return `_afterReceive${capitalize(camelCase(method))}`
}

module.exports = {
  camelCase,
  capitalize,
  methodName,
  handlerName,
  beforeSendName,
  beforeReceiveName,
  afterSendName,
  afterReceiveName
}
