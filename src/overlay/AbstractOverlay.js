/*
MIT License

Copyright (c) 2016 Grall Arnaud

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

const EventEmitter = require ('events');

class AbstractOverlay extends EventEmitter {
  constructor (options) {
    super();
    if(!options.previous) {
      // NEED A BASE (a RPS or an another overlay)
      throw new SyntaxError('NEED A BASE (a RPS or an another overlay)');
    }
    this.manager = options.manager;
    this.previous = options.previous;
    this.options =  options;
  }

  /**
   * Connect an Overlay to another Overlay of the same type ! By using a the previous
   * @param  {AbstractAdapter|AbstractOverlay} previousNetwork The previous network you can use to connect to another peer/neighbour
   * @param  {number} timeout Specify the timeout of the connection
   * @return {Promise}  Return a promise, resolve when the connection is successsfully achieved, rejected by tiemout or errors during the connection
   */
  connection (previousNetwork, timeout) {
    throw new Error('Connection Not Yet Implemented', 'AbstractOverlay.js');
  }

  /**
   * Get the list of neighbours
   * @return {array}
   */
  getNeighbours () {
    throw new Error('getNeighbours Not Yet Implemented', 'AbstractOverlay.js');
  }

  /**
   * Listen broadcasted messages,
   * @param  {callback} callback Callback of the broadcast, works as EventEmitter works, no need to pass a signal to listen on.
   * @return {void}
   */
  onBroadcast (callback) {
    throw new Error('onBroadcast Not Yet Implemented', 'AbstractOverlay.js');
  }

  /**
  * Send a broadcast message to all connected clients.
  * @function sendBroadcast
  * @param {object} msg - Message to send,
  * @param {string} id - Id of the message to wait before to receive the message sent (see VVwE: github.com/chat-wane/version-vector-with-exceptions).
  * @returns {void}
  */
  sendBroadcast (msg) {
    throw new Error('senBroadcast Not Yet Implemented', 'AbstractOverlay.js');
  }

  /**
  * This callback is a parameter of the onUnicast function.
  * @callback callback
  * @param {string} id - sender id
  * @param {object} message - the message received
  */
  /**
  * onUnicast function allow you to listen on the Unicast Definition protocol, Use only when you want to receive a message from a neighbour
  * @function onUnicast
  * @param {callback} callback The callback for the listener
  * @return {void}
  */
  onUnicast (callback) {
    throw new Error('onUnicast Not Yet Implemented', 'AbstractOverlay.js');
  }

  /**
  * Send a message to a specific neighbour (id)
  * @function sendUnicast
  * @param {object} message - The message to send
  * @param {string} id - One of your neighbour's id
  * @return {boolean} return true if it seems to have sent the message, false otherwise.
  */
  sendUnicast (message, id) {
    throw new Error('sendUnicast Not Yet Implemented', 'AbstractOverlay.js');
  }

  /**
   * Init a shuffle of the network, i.e: renewing the neighborhood.
   * @return {void}
   */
  exchange () {
    throw new Error('exchange Not Yet Implemented', 'AbstractOverlay.js');
  }

}

module.exports = AbstractOverlay;
