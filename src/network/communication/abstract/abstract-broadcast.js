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

const EventEmitter = require('events');
const Unicast = require('./../unicast/unicast.js');
const debug = require('debug')('foglet-core:communication:abstractbroadcast');

/**
 * AbstractBroadcast represents an abstract broadcast protocol.
 * @abstract
 * @extends EventEmitter
 * @author Thomas Minier
 */
class AbstractBroadcast extends EventEmitter {
  /**
   * Constructor
   * @param  {AbstractAdapter} source - The source RPS/overlay
   * @param  {string} protocol - The name of the broadcast protocol
   */
  constructor (source, protocol) {
    super();
    debug(source, protocol);
    this.source = source;
    this.protocol = 'foglet-broadcast-protocol-' + protocol;
    this.unicast = new Unicast(source, protocol);
    this.unicast.on('receive', (id, message) => {
      this._receiveMessage(id, message);
    });
  }

  /**
   * Send a message in broadcast
   * @param  {Object}  message  - The message to send
   * @param  {Boolean} [isReady=undefined]
   * @return {boolean}
   */
  send (message, isReady = undefined) {
    throw new Error('A valid broadcast protocol should implement a send method');
  }

  /**
   * Handler executed when a message is recevied
   * @param  {string} id  - Message issuer's ID
   * @param  {Object} message - The message received
   * @return {void}
   */
  _receive (id, message) {
    throw new Error('A valid broadcast protocol should implement a _receiveMessage method');
  }
}

module.exports = AbstractBroadcast;
