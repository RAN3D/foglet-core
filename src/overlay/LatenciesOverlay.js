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

const AbstractOverlay = require('./AbstractOverlay.js');
const debug = require('debug')('foglet-core:om:latencies');
const TMan = require('tman-wrtc');
const io = require('socket.io-client');
const Unicast = require('unicast-definition');
const FBroadcast = require('../flib/fbroadcast.js');
const lmerge = require('lodash/merge');
const uuid = require('uuid/v4');

class LatenciesOverlay extends AbstractOverlay {
  constructor (options = {}) {
    debug(options);
    super(options);
    // merge previous overlay/rps options with default options for the overlay.
    this.options.options = lmerge({
      protocol: 'latencies-overlay-network',
      descriptor: {}, // no need for a descriptor because we compute a ping every delta milliseconds in the ranking functions
      descriptorTimeout: 10 * 1000,
      delta: 5 * 1000,
      timeout: 60 * 60 * 1000,
      ranking: (peer, foglet = this) => (a, b) => {
        foglet._ping(a.peer).then((timeA) => {
          foglet._ping(b.peer).then((timeB) => {
            debug('Ping: ', timeA, timeB);
            if(timeA < timeB) return 1;
            if(timeA > timeB) return -1;
            return 0;
          }).catch(e => {
            debug('Ping: one peer is unreachable peer', a.peer, ' win with ', timeA);
            return 1;
          });
        }).catch(e => {
          foglet._ping(b.peer).then((timeB) => {
            debug('Ping: one peer is unreachable peer', b.peer, ' win with', timeB);
            return -1;
          }).catch(e => {
            debug('Ping: peers are unreachable. No one win.');
            return 0;
          });
        })
      },
      webrtc:	{ // add WebRTC options
        trickle: true, // enable trickle (divide offers in multiple small offers sent by pieces)
        iceServers : [] // define iceServers in non local instance
      }
    }, this.previous.overlay.options);
    // override options with specified options at top level
    this.options.options = lmerge(this.options.options, options.options);
    // if webrtc options specified: create object config for Spray
    this.options = lmerge({config: this.options.webrtc}, this.options);
    this.id = 'latencies';

    // need at least a descriptor and a ranking function
    if(!this.options.options.descriptor || !this.options.options.ranking || typeof this.options.options.descriptor !== 'object' || typeof this.options.options.ranking !== 'function' )
      throw new SyntaxError('Need at least a descriptor (object) and a ranking function (function).');

    this.rps = new TMan(this.options.options, this.previous.overlay.rps);

    this.inviewId = this.rps.getInviewId();
    this.outviewId = this.rps.getOutviewId();
    this.id = this.inviewId+'_'+this.outviewId;

    // Unicast protocol to send message to remote peers
    this.unicast = new Unicast(this.rps, {pid: this.options.options.protocol});

    // Broadcast protocol so send message to the whole network
    this.broadcast = new FBroadcast({
      rps: this,
      protocol: this.options.options.protocol
    });

    //	Connection to the signaling server
    this.signaling = io.connect(this.options.options.signalingAdress, {reconnectionDelay : 5000, origins: options.options.origins});
    this.status = 'disconnected';


    this.directCallback = (src, dest) => {
      return (offer) => {
        dest.connect( (answer) => {
          src.connect(answer);
        }, offer);
      };
    };

    this.signalingInit = () => {
      return (offer) => {
        debug(`@${this.inviewId}: Emit the new offer: `, offer);
        if(this.status === 'disconnected') this.signaling.emit('new', {offer, room: this.options.options.room});
      };
    };
    this.signaling.on('new_spray', (data) => {
      const signalingAccept = (offer) => {
        debug(`@${this.inviewId}: Emit the accepted offer: `, offer);
        this.signaling.emit('accept', { offer, room: this.options.options.room });
      };
      debug(`@${this.inviewId}: Receive a new offer: `, data);
      this.rps.connect(signalingAccept, data);
    });
    this.signaling.on('accept_spray', (data) => {
      debug('Receive an accepted offer: ', data);
      this.rps.connect(data);
    });

    this.signaling.on('connected', () => {
      this.emit('connected');
    });

    // initialize listeners for incoming pong requests
    this.onUnicast((id, msg, ...args) => {
      // debug('Receive a message: ', id, msg, ...args, this.getNeighbours(Infinity));
      if(msg.type === 'ping') {
        // debug('Receive a ping;');
        // if this is a ping request emit the message on id Listeners
        msg.type = 'pong';
        let index = this.getNeighbours(Infinity).indexOf(id);
        if(index === -1) {
          debug('Cant send a response, unreachable source');
        } else {
          this.sendUnicast(msg, id);
        }
      } else if( msg.type === 'pong') {
        // debug('Receive a pong;');
        this.emit('pong-'+msg.id, msg);
      }
    });

    debug('Latencies Overlay initialized.');
  }

  /**
   * Ping the specified id
   * @param  {string} id id of the peer to ping
   * @return {Promise} Return a promise with the specified {Time} representing the ping between {this} and the peer {id}
   */
  _ping (id) {
    return new Promise((resolve, reject) => {
      try {
        let index = this.getNeighbours().indexOf(id);
        if(index === -1) reject('id not in our list of neighbours');
        const idMessage = uuid();
        let pingTime = (new Date()).getTime();
        // send a ping request
        this.sendUnicast({
          id: idMessage,
          sourcei: this.inviewId,
          sourceo: this.outviewId,
          type: 'ping'
        }, id);
        this.once('pong-'+idMessage, (msg) => {
          // listening for an incoming response of our ping
          // double check if message is a goood message,
          if(msg.id === idMessage){
            let time = (new Date()).getTime() - pingTime;
            resolve(time);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Connect a spray RPS to another spray RPS by using a signaling server
   * @param  {SprayAdapter} rps Do you want to connect to a direct {SprayAdapter} object ? Do it by adding the object here.
   * @param  {number} timeout Specify the timeout of the connection
   * @return {Promise}  Return a promise, resolve when the connection is successfully achieved, rejected by tiemout or errors during the connection
   */
  connection (rps, timeout) {
    debug(rps, timeout);
    const self = this;
    return new Promise(function (resolve, reject) {
      try {
        if(rps) {
          self.rps.join(self.directCallback(self.rps, rps)).then(() => {
            self.emit('connected', { room: self.options.options.room });
          }).catch(error => {
            debug(error);
            if(error === 'connected') {
              self.status = 'connected';
              resolve(true);
            } else {
              reject(error);
            }
          });
        } else {
          self.signaling.emit('joinRoom', { room: self.options.options.room });
          self.signaling.once('joinedRoom', () => {
            debug(' Joined the room', self.options.room);
            self.rps.join(self.signalingInit()).then(() => {
              self.signaling.emit('connected', { room: self.options.options.room }); // emit to the server that we are connected.
            }).catch(error => {
              debug(error);
              if(error === 'connected') {
                self.status = 'connected';
                resolve(true);
              } else {
                reject(error);
              }
            });
          });
        }
        self.once('connected', () => {
          debug(`@${self.id} is now connected`);
          self.status = 'connected';
          resolve(true);
        });
        setTimeout(() => {
          reject('timeout');
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
    this.unicast.on(this.options.options.protocol, callback);
  }

  /**
  * Send a message to a specific neighbour (id)
  * @function sendUnicast
  * @param {object} message - The message to send
  * @param {string} id - One of your neighbour's id
  * @return {boolean} return true if it seems to have sent the message, false otherwise.
  */
  sendUnicast (message, id) {
    return this.unicast.emit(this.options.options.protocol, id, this.outviewId, message);
  }

  /**
   * Get the list of neighbours
   * @return {array}
   */
  getNeighbours (k = undefined) {
    // BUG, sometimes our id is in our partial view.
    // Tempory fix by removing this element if in results
    let result = this.rps.getPeers(k);
    // lremove(result, (elem) => {
    //   return elem === this.inviewId;
    // })
    return result;
  }

  /**
   * Optionnal: Init a shuffle of the network, i.e: renewing the neighborhood.
   * @return {void}
   */
  exchange () {
    this.rps._exchange();
  }
}

module.exports = LatenciesOverlay;
