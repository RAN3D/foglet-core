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

/**
 * AbstractUnicast represents an abstract unicast protocol.
 * @abstract
 * @extends EventEmitter
 * @author Thomas Minier
 */
class AbstractUnicast extends EventEmitter {
  /**
   * Constructor
   * @param  {AbstractAdapter} source - The source RPS/overlay
   * @param  {string} protocol - The name of the broadcast protocol
   */
  constructor (source, protocol) {
    super();
    this.source = source;
    this.protocol = 'foglet-unicast-protocol-' + protocol;
  }

  /**
   * Send a message to the peer specified by its id
   * @param  {string}  id  - The id to send the message
   * @param  {Object} message
   */
  send (id, message) {
    throw new Error('A valid unicast protocol should implement a send method with a msg and id.');
  }

  /**
   * Handler executed when a message is recevied
   * @param  {string} id  - Message issuer's ID
   * @param  {Object} message - The message received
   * @return {void}
   */
  _receive (id, message) {
    throw new Error('A valid unicast protocol should implement a _receiveMessage method');
  }
}

module.exports = AbstractUnicast;
