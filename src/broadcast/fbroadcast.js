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

const AbstractBroadcast = require('./abstract-broadcast.js');
const uuid = require('uuid/v4');
const lmerge = require('lodash/merge');
const sortedIndexBy = require('lodash/sortedIndexBy');
const debug = require('debug')('foglet-core:broadcast');
const VV = require('../utils/vv.js'); // Version-Vector
const messages = require('./messages.js');

// currenlty unused
// function clone (obj) {
//   return lmerge({}, obj);
// }

/**
 * Format the IDs of messages in string format
 * @param  {Obbject} message - The message to format
 * @return {string} The formatted message's id in string format
 */
function formatID (message) {
  return `_e=${message.id._e}&_c=${message.id._c}`;
}

/**
 * FBroadcast represent the base implementation of a broadcast protocol for the foglet library.
 * @extends AbstractBroadcast
 * @author Arnaud Grall (Folkvir)
 */
class FBroadcast extends AbstractBroadcast {
  constructor (options) {
    super(options.rps, options.protocol);
    if(options.rps && options.protocol) {
      this.options = lmerge({
        delta: 1000 * 60 * 1 / 2,
        timeBeforeStart: 2 * 1000
      }, options);
      this.uid = uuid();
      this.causality = new VV(this.uid);
      this.causality.incrementFrom({ _e: this.uid, _c: 0 });
      // The sniffer is applied before a message is sent or received
      this.sniffer = this.options.sniffer || function (message) {
        return message;
      };

      // buffer of received messages
      this.buffer = [];
      // buffer of anti-entropy messages (chunkified because of large size)
      this.bufferAntiEntropy = messages.MAntiEntropyResponse('init');

      debug(`initialized for:  ${this.options.protocol}`);
    } else {
      return new Error('Not enough parameters', 'fbroadcast.js');
    }
  }

  /**
   * Send a message to all neighbours
   * @private
   * @param  {Object} message - The message to send
   * @return {void}
   */
  _sendAll (message) {
    const n = this.source.getNeighbours(Infinity);
    if(n.length > 0) n.forEach(p => this.unicast.emit(this.protocol, p, this.source.outviewId, message).catch(e => debug('Error: It seems there is not a receiver', e)));
  }

  /**
   * Send a message in broadcast
   * @param  {Object}  message  - The message to send
   * @param  {Boolean} [isReady=undefined]
   * @return {boolean}
   */
  send (message, isReady = undefined) {
    const sniffed = this.sniffer(message);
    if(sniffed) {
      message = sniffed;
    }
    const a = this.causality.increment();
    const broadcastMessage = messages.BroadcastMessage(this.protocol, a, isReady || this.causality.clone(), message);
    // #2 register the message in the structure
    this.causality.incrementFrom(a);

    // #3 send the message to the neighborhood
    this._sendAll(broadcastMessage);
    return broadcastMessage.isReady;
  }

  /**
   * On reception of a message
   * @deprecated
   * @param  {[type]} message [description]
   * @return {[type]}         [description]
   */
  _onReceive (message) {
    const sniffed = this.sniffer(message);
    if(sniffed) {
      message = sniffed;
    }
    this.emit('receive', message);
  }

  /**
   * Send entropy response
   * @deprecated
   * @param  {[type]} origin             [description]
   * @param  {[type]} causalityAtReceipt [description]
   * @param  {[type]} messages           [description]
   * @return {[type]}                    [description]
   */
  sendAntiEntropyResponse (origin, causalityAtReceipt, messages) {
    let id = uuid();
    // #1 metadata of the antientropy response
    let sent = this.unicast.emit(this.protocol, origin, this.source.outviewId, messages.MAntiEntropyResponse(id, causalityAtReceipt, messages.length));
    let i = 0;
    while (sent && i < messages.length) {
      sent = this.unicast.emit(this.protocol, origin, this.source.outviewId, messages.MAntiEntropyResponse(id, null, messages.length, messages[i]));
      ++i;
    }
  }

  /**
   * Handler executed when a message is recevied
   * @param  {string} id  - Message issuer's ID
   * @param  {Object} message - The message received
   * @return {void}
   */
  _receiveMessage (id, message) {
    switch (message.type) {
    default: {
      if (!this._shouldStopPropagation(message)) {
        // if not present, add the issuer of the message in the message
        if (!('issuer' in message))
          message.issuer = id;
        // #1 register the operation
        // maintain `this.buffer` sorted to search in O(log n)
        const index = sortedIndexBy(this.buffer, message, formatID);
        this.buffer.splice(index, 0, message);
        // #2 deliver
        this._reviewBuffer();
        // #3 rebroadcast
        this._sendAll(message);
      }
      break;
    }
    }
  }

  /**
   * Check if a message should be propagated or not
   * @private
   * @param  {Object} message - The message to check
   * @return {boolean} True if the message should not be propagated, False if it should be.
   */
  _shouldStopPropagation (message) {
    if (this.causality.isLower(message.id))
      return true;
    return this._findInBuffer(formatID(message)) > -1;
  }

  /**
   * Try to find the index of a message in the internal buffer
   * @private
   * @param  {string} id - Message's ID
   * @return {int} The index of the message in the buffer, or -1 if not found
   */
  _findInBuffer (id) {
    // use a binary search algorithm since `this.buffer` is sorted by IDs
    let minIndex = 0;
    let maxIndex = this.length - 1;
    let currentIndex, currentElement;

    while (minIndex <= maxIndex) {
      currentIndex = (minIndex + maxIndex) / 2 | 0;
      currentElement = formatID(this.buffer[currentIndex]);

      if (currentElement < id) {
        minIndex = currentIndex + 1;
      } else if (currentElement > id) {
        maxIndex = currentIndex - 1;
      } else {
        return currentIndex;
      }
    }
    return -1;
  }

  /**
   * Scan internal buffer to deliver waiting messages
   * @private
   * @return {void}
   */
  _reviewBuffer () {
    let message, found = false;
    for (let index = this.buffer.length - 1; index >= 0; --index) {
      message = this.buffer[index];
      if (this.causality.isLower(message.id)) {
        this.buffer.splice(index, 1);
      } else {
        found = true;
        this.causality.incrementFrom(message.id);
        this.buffer.splice(index, 1);
        this.emit('receive', message.payload, message.issuer);
      }
    }
    if (found) {
      this._reviewBuffer();
    }
  }
}

module.exports = FBroadcast;
