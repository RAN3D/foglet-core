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

const uuid = require('uuid/v4')
const Writable = (require('readable-stream')).Writable
const messages = require('./messages.js')

/**
 * A StreamRequest enable to stream data to a peer using a push-based API.
 * @extends Writable
 * @author Thomas Minier
 * @example
 * const foglet = getSomeFoglet();
 * const peerID = getSomePeerID();
 *
 * const stream = foglet.streamUnicast(peerID);
 * stream.write('Hello');
 * stream.write(' world!');
 * stream.end();
 */
class StreamRequest extends Writable {
  /**
   * Constructor
   * @param {function} send - Function called to send a message
   */
  constructor (send) {
    super({
      objectMode: true
    })
    this._id = uuid()
    this._send = send
    this._trailers = []
    this._last_id = undefined
  }

  /**
   * Add a trailer.
   * All trailers will be sent after the stream is closed, so this method can be called ny number of times
   * before the `end` method is called.
   * @param {*} value - The trailing data
   * @return {void}
   */
  addTrailer (value) {
    this._trailers.push(value)
  }

  /**
   * Destroy the stream and emit an error on the `error` event.
   * This error will be propagated to peer(s) that which data was streamed, and the associated output stream
   * will also be destroyed.
   * @param {string} error - The error responsible for the stream's destruction
   */
  destroy (error) {
    this._last_id = this._send(messages.StreamMessageError(this._id, error), null, this._last_id)
    super.destroy(error)
  }

  /**
   * @private
   */
  _write (msg, encoding, callback) {
    this._last_id = this._send(messages.StreamMessageChunk(this._id, msg), null, this._last_id)
    callback()
    return this._last_id
  }

  /**
   * Send trailers if presents & close the transmission
   * @private
   */
  _final (callback) {
    if (this._trailers.length > 0) { this._last_id = this._send(messages.StreamMessageTrailers(this._id, this._trailers), null, this._last_id) }
    this._last_id = this._send(messages.StreamMessageEnd(this._id), null, this._last_id)
    callback()
  }
}

module.exports = StreamRequest
