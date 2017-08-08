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
'use strict';

const uuid = require('uuid/v4');
const Writable = require('stream').Writable;
const messages = require('./messages.js');

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
    });
    this._id = uuid();
    this._send = send;
    this._trailers = [];
    this.on('finish', this._end);
  }

  /**
   * Add a trailer.
   * All trailers will be sent after the stream is closed, so this method can be called ny number of times
   * before the `end` method is called.
   * @param {*} value - The trailing data
   * @return {void}
   */
  addTrailer (value) {
    this._trailers.push(value);
  }

  /**
   * @private
   */
  _write (msg, encoding, callback) {
    this._send(messages.StreamMessageChunk(this._id, msg));
    callback();
  }

  /**
   * Send trailers if presents & close the transmission
   * @private
   */
  _end () {
    if (this._trailers.length > 0)
      this._send(messages.StreamMessageTrailers(this._id, this._trailers));
    this._send(messages.StreamMessageEnd(this._id));
  }
}

module.exports = StreamRequest;
