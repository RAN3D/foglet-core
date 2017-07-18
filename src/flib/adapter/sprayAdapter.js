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
const Spray = require('spray-wrtc');
const io = require('socket.io-client');
const Q = require('q');
const AbstractAdapter = require('./AbstractAdapter.js');
const Unicast = require('unicast-definition');
const FBroadcast = require('../fbroadcast.js');
const log = require('debug')('foglet-core:spray-wrtc');

class SprayAdapter extends AbstractAdapter {
  constructor (options) {
    super();
    this.options = lmerge({
      origins:'*',
    }, options);

    this.rps = new Spray(this.options);
    this.inviewId = this.rps.getInviewId();
    this.outviewId = this.rps.getOutviewId();
    this.id = this.inviewId+'_'+this.outviewId;

    // Unicast protocol to send message to remote peers
    this.unicast = new Unicast(this.rps, {pid: this.protocol});

    // Broadcast protocol so send message to the whole network
    this.broadcast = new FBroadcast({
      rps: this,
      protocol: this.options.protocol
    });
    //	Connection to the signaling server
    this.signaling = io.connect(this.options.signalingAdress, {origins: options.origins});


    this.directCallback = (src, dest) => {
      return (offer) => {
        dest.connect( (answer) => {
          src.connect(answer);
        }, offer);
      };
    };

    this.signalingInit = () => {
      return (offer) => {
        log(`@${this.inviewId}: Emit the new offer: `, offer);
        this.signaling.emit('new', {offer, room: this.options.room});
      };
    };
    this.signaling.on('new_spray', (data) => {
      const signalingAccept = (offer) => {
        log(`@${this.inviewId}: Emit the accepted offer: `, offer);
        this.signaling.emit('accept', { offer, room: this.options.room });
      };
      log(`@${this.inviewId}: Receive a new offer: `, data);
      this.rps.connect(signalingAccept, data);
    });
    this.signaling.on('accept_spray', (data) => {
      log('Receive an accepted offer: ', data);
      this.rps.connect(data);
    });

    this.signaling.on('connected', () => {
      this.emit('connected');
    });
  }

  /**
   * Connect a spray RPS to another spray RPS by using a signaling server
   * @param  {SprayAdapter} rps Do you want to connect to a direct {SprayAdapter} object ? Do it by adding the object here.
   * @param  {number} timeout Specify the timeout of the connection
   * @return {Promise}  Return a promise, resolve when the connection is successfully achieved, rejected by tiemout or errors during the connection
   */
  connection (rps, timeout) {
    log('Pending connection...');
    const self = this;
    return Q.Promise(function (resolve, reject) {
      try {
        if(rps) {
          self.rps.join(self.directCallback(self.rps, rps.rps)).then(() => {
            self.emit('connected', { room: self.options.room });
          }).catch(error => {
            log(error);
            if(error === 'connected') {
              resolve(true);
            } else {
              reject(error);
            }
          });
        } else {
          self.signaling.emit('joinRoom', { room: self.options.room });
          self.signaling.once('joinedRoom', () => {
            log(' Joined the room', self.options.room);
            self.rps.join(self.signalingInit()).then(() => {
              self.signaling.emit('connected', { room: self.options.room }); // emit to the server that we are connected.
            }).catch(error => {
              log(error);
              if(error === 'connected') {
                resolve(true);
              } else {
                reject(error);
              }
            });
          });
        }
        self.once('connected', () => {
          log(`@${self.id} is now connected`);
          resolve(true);
        });
        setTimeout(() => {
          reject();
        }, timeout);
      } catch (error) {
        reject(error);
      }
    });
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
    return this.unicast.emit(this.options.protocol, id, this.outviewId, message);
  }

  /**
   * Get the list of neighbours
   * @return {array}
   */
  getNeighbours (k = undefined) {
    return this.rps.getPeers(k);
  }

  /**
   * Init a shuffle of the network, i.e: renewing the neighborhood.
   * @return {void}
   */
  exchange () {
    this.rps.exchange();
  }
}

module.exports = SprayAdapter;
