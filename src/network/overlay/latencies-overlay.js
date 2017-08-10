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

const debug = require('debug')('foglet-core:network-overlay:latencies');

// abstract
const AbstractOverlay = require('./../abstract/abstract-overlay.js');

// network
const TMan = require('tman-wrtc');

// overlay internal communication
const Communication = require('./../communication/communication.js');

// utils
const lmerge = require('lodash.merge');
const uuid = require('uuid/v4');

class LatenciesOverlay extends AbstractOverlay {
  constructor (options = {}) {
    super(options);
    // merge previous overlay/rps options with default options for the overlay.
    this.options = lmerge({
      descriptor: {}, // no need for a descriptor because we compute a ping every delta milliseconds in the ranking functions
      descriptorTimeout: 10 * 1000,
      ranking: (peer, foglet = this) => (a, b) => {
        foglet._ping(a.peer).then((timeA) => {
          return foglet._ping(b.peer).then((timeB) => {
            debug('Ping: ', timeA, timeB);
            if(timeA < timeB) return 1;
            if(timeA > timeB) return -1;
            return 0;
          }).catch(e => {
            debug(e, 'Ping: one peer is unreachable peer', a.peer, ' win with ', timeA);
            return 1;
          });
        }).catch(e => {
          return foglet._ping(b.peer).then((timeB) => {
            debug(e, 'Ping: one peer is unreachable peer', b.peer, ' win with', timeB);
            return -1;
          }).catch(e => {
            debug(e, 'Ping: peers are unreachable. No one win.');
            return 0;
          });
        });
      }
    }, this.options);

    // if webrtc options specified: create object config for Spray
    this.options = lmerge({config: this.options.webrtc}, this.options);

    // need at least a descriptor and a ranking function
    if(!this.options.descriptor || !this.options.ranking || typeof this.options.descriptor !== 'object' || typeof this.options.ranking !== 'function' )
      throw new SyntaxError('Need at least a descriptor (object) and a ranking function (function).');

    this.rps = new TMan(this.options, this.manager.rps.network.rps);

    // initialize listeners for incoming pong requests
    this.communication = new Communication(this, this.options.protocol + '-internal-communication');
    this.communication.onUnicast((id, msg) => {
      // debug('Receive a message: ', id, msg, ...args, this.getNeighbours(Infinity));
      if(msg.type === 'ping') {
        // debug('Receive a ping;');
        // if this is a ping request emit the message on id Listeners
        msg.type = 'pong';
        let index = this.getNeighbours(Infinity).indexOf(id);
        if(index === -1) {
          debug('Cant send a response, unreachable source');
        } else {
          this.communication.sendUnicast(id, msg);
        }
      } else if( msg.type === 'pong') {
        // debug('Receive a pong;');
        this.emit('pong-'+msg.id, msg);
      }
    });

    debug('Latencies Overlay initialized.');
  }

  get inviewId () {
    return this.rps.getInviewId();
  }

  get outviewId () {
    return this.rps.getOutviewId();
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
        this.communication.sendUnicast(id, {
          id: idMessage,
          sourcei: this.inviewId,
          sourceo: this.outviewId,
          type: 'ping'
        }).catch(error => {
          reject(error);
        });
        this.once('pong-'+idMessage, (msg) => {
          // listening for an incoming response of our ping
          // double check if message is a goood message,
          if(msg.id === idMessage) {
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
}

module.exports = LatenciesOverlay;
