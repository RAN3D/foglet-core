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

const uuid = require('uuid/v4')

/**
 * An AnswerQueue stamp messages with unique ids and allow peers to answer to service calls
 * using the `reply` and `reject` helpers.
 * @author Thomas Minier
 */
class AnswerQueue {
  /**
   * Constructor
   */
  constructor () {
    this._waitingAnswers = new Map()
  }

  /**
   * Stamp a message and connect to a promise resolved with it answer
   * @param {Object} message - The message to stamp
   * @param {function} resolve - The function used to resolve the promise when the answer is received
   * @param {function} reject - The function used to reject the promise when the answer is received
   * @return {Object} The stamped message
   */
  stamp (message, resolve, reject) {
    const answerID = uuid()
    this._waitingAnswers.set(answerID, { resolve, reject })
    return Object.assign({ answerID }, message)
  }

  /**
   * Resolve the answer to a message
   * @param {string} answerID - The id of the answer to resolve
   * @param {*} payload - The answer's content
   * @return {void}
   */
  resolve (answerID, payload) {
    if (this._waitingAnswers.has(answerID)) {
      this._waitingAnswers.get(answerID).resolve(payload)
      this._waitingAnswers.delete(answerID)
    }
  }

  /**
   * Resolve an answer by a reject
   * @param {string} answerID - The id of the answer to reject
   * @param {*} payload - The answer's content
   * @return {void}
   */
  reject (answerID, payload) {
    if (this._waitingAnswers.has(answerID)) {
      this._waitingAnswers.get(answerID).reject(payload)
      this._waitingAnswers.delete(answerID)
    }
  }
}

module.exports = AnswerQueue
