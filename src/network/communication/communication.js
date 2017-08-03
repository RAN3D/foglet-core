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
'use strict';

// const debug = require('debug')('foglet-core:communication');
const Unicast = require('./unicast/unicast.js');
const Broadcast = require('./broadcast/broadcast.js');

/**
 * Communication is a facade to send messages to peers in a network using unicast or broadcast channels.
 * @author Grall Arnaud (Folkvir)
 */
class Communication {
  constructor (source, protocol) {
    this.network = source;
    this.unicast = new Unicast(this.network, protocol);
    this.broadcast = new Broadcast(this.network, protocol);
  }

  /**
   * Send a message to a specified peer
   * @param  {string} id - Id of the message to send
   * @param  {Object} message - Message to send
   * @return {Promise} Promise fulfilled when the message is sent
   */
  sendUnicast (id, message) {
    return this.unicast.send(id, message);
  }

  /**
   * @todo Complete tests of this function
   * Send a message to multiple peers
   * @param  {string[]} ids - Array of ids to the send message
   * @param  {Object} message - Message to send
   * @return {Promise} Promise fulfilled when all message are sent
   */
  sendMulticast (ids, message) {
    return this.unicast.sendMultiple(ids, message);
  }

  /**
  * Send a broacasted message
  * @param  {Object} message Message to broadcast over the network
  * @param  {VersionVector} isReady Id of the message to wait before this message is received
  * @return {Object}  id of the message sent
  */
  sendBroadcast (message, isReady = undefined) {
    return this.broadcast.send(message, isReady);
  }

  /**
  * Listen on incoming unicasted message
  * @param  {MessageCallback} callback - Callback invoked with the message
  * @return {void}
  */
  onUnicast (callback) {
    this.unicast.on('receive', (id, message) => {
      callback(id, message);
    });
  }

  /**
  * Listen to an incoming unicasted message, and then remove the listener
  * @param  {MessageCallback} callback - Callback invoked with the message
  * @return {void}
  */
  onOnceUnicast (callback) {
    this.unicast.once('receive', (id, message) => {
      callback(id, message);
    });
  }

  /**
   * Listen on broadcasted messages
   * @param  {MessageCallback} callback - Callback invoked with the message
   * @return {void}
   */
  onBroadcast (callback) {
    this.broadcast.on('receive', (id, message) => callback(id, message));
  }

  /**
   * Listen to a broadcasted message, then remove the listener
   * @param  {MessageCallback} callback - Callback invoked with the message
   * @return {void}
   */
  onOnceBroadcast (callback) {
    this.broadcast.once('receive', (id, message) => callback(id, message));
  }

  /**
   * Remove all 'receive' unicast callback
   * @return {void}
   */
  removeAllUnicastCallback () {
    this.unicast.removeAllListeners('receive');
  }

  /**
   * Remove all 'receive' broadcast callback
   * @return {void}
   */
  removeAllBroacastCallback () {
    this.broadcast.removeAllListeners('receive');
  }
}

module.exports = Communication;
