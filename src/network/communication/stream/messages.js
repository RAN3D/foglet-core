/*
MIT License

Copyright (c) 2016-2017 Grall Arnaud

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the 'Software'), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
'use strict'

/**
 * Get a function thta build a StreamMessage with a specific type
 * @private
 * @param {string} type - Message's type
 */
const StreamMessage = type => {
  return (id, payload) => {
    return {
      id,
      type,
      payload
    }
  }
}

/**
 * A message send with a chunk of data
 * @private
 */
const StreamMessageChunk = StreamMessage('chunk')

/**
 * A message send with trailing data
 * @private
 */
const StreamMessageTrailers = StreamMessage('trailers')

/**
 * A message that close a transmission
 * @private
 */
const StreamMessageEnd = StreamMessage('end')

/**
 * A message that signal an error
 * @private
 */
const StreamMessageError = StreamMessage('error')

module.exports = {
  StreamMessageChunk,
  StreamMessageTrailers,
  StreamMessageEnd,
  StreamMessageError
}
