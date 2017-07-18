/*
MIT License

Copyright (c) 2016 Grall Arnaud

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

const lmerge = require('lodash/merge');
const Fcn = require('fcn-wrtc').Fcn;
const AbstractAdapter = require('./AbstractAdapter.js');
const FBroadcast = require('../fbroadcast.js');
const Unicast = require('unicast-definition');

class fcnAdapter extends AbstractAdapter {
  constructor (options) {
    super();
    this.options = lmerge({}, options);

    this.rps = new Fcn(this.options);
    this.options.rps = this.rps;

    // Unicast protocol to send message to remote peers
    this.unicast = new Unicast(this.rps, {pid: this.options.protocol});

    // Broadcast protocol so send message to the whole network
    this.broadcast = new FBroadcast({
      rps: this,
      protocol: this.options.protocol
    });
  }

  get inviewId () {
    return this.rps.getInviewId();
  }

  get outiewId () {
    return this.rps.getOutviewId();
  }

  connection (rps, timeout) {
    if(rps) return this.rps.connection(rps.rps, timeout);
    return this.rps.connection(undefined, timeout);
  }

  /**
  * Allow to listen on Foglet when a broadcasted message arrived
  * @function onBroadcast
  * @param {callback} callback - Callback function that handles the response
  * @returns {void}
  **/
  onBroadcast (callback) {
    this.broadcast.on('receive', callback);
  }


  /**
  * Send a broadcast message to all connected clients.
  * @function sendBroadcast
  * @param {object} msg - Message to send,
  * @param {string} id - Id of the message to wait before to receive the message sent (see VVwE: github.com/chat-wane/version-vector-with-exceptions).
  * @returns {void}
  */
  sendBroadcast (msg, id) {
    return this.broadcast.send(msg, id);
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
    this.unicast.on(this.options.protocol, callback);
  }

  /**
  * Send a message to a specific neighbour (id)
  * @function sendUnicast
  * @param {object} message - The message to send
  * @param {string} id - One of your neighbour's id
  * @return {boolean} return true if it seems to have sent the message, false otherwise.
  */
  sendUnicast (message, id) {
    return this.unicast.emit(this.options.protocol, id, this.rps.getOutviewId(), message);
  }

  getNeighbours (k = undefined) {
    return this.rps.getPeers(k).o;
  }

  exchange () {
    // nothing to do
  }
}

module.exports = fcnAdapter;
