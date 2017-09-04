/*
MIT License

Copyright (c) 2016-2017 Grall Arnaud & Minier Thomas

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

const AbstractOverlay = require('./../abstract/abstract-overlay.js');
const Communication = require('./../communication/communication.js');
const TMan = require('tman-wrtc');
const lmerge = require('lodash.merge');
const uuid = require('uuid/v4');
const debug = require('debug')('foglet-core:latencies-overlay');

/**
 * A TManOverlay is an abstract network used to build overlay based on the TMan network over WebRTC.
 * @see https://github.com/RAN3D/tman-wrtc for more informations on TMan.
 * @abstract
 * @extends AbstractOverlay
 * @author Thomas Minier & Grall Arnaud
 */
class TManLatenciesOverlay extends AbstractOverlay {

  constructor (options) {
    super(options);
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
          // debug('Cant send a response, unreachable source');
        } else {
          this.communication.sendUnicast(id, msg);
        }
      } else if( msg.type === 'pong') {
        // debug('Receive a pong;');
        this.emit('pong-'+msg.id, msg);
      }
    });
    console.log('Latencies Overlay options:', this.options);
    this._rps._start(this.options.delta);
    debug('Latencies Overlay initialized.');
  }

  /**
   * The in-view ID of the peer in the network
   * @return {string} The in-view ID of the peer
   */
  get inviewId () {
    return this.rps.getInviewId();
  }

  /**
   * The out-view ID of the peer in the network
   * @return {string} The out-view ID of the peer
   */
  get outviewId () {
    return this.rps.getOutviewId();
  }

  /**
   * Build a TMan network
   * @param {Object} options - Options used to build the TMan
   * @return {TMan} The TMan network
   */
  _buildRPS (options) {
    let globalOptions = options.manager._options.overlay.options;

    // if webrtc options specified: create object config for Spray
    this.options = lmerge({config: globalOptions.webrtc}, this.options);
    // now merge of all options
    this.options = lmerge(globalOptions, this.options);

    const tmanOptions = lmerge({
      descriptor: this._descriptor(),
      descriptorTimeout: this._descriptorTimeout(),
      ranking: this._rankingFunction()
    }, this.options);

    return new TMan(tmanOptions, options.manager._rps._network._rps);
  }

  /**
   * Gives the start descriptor used by the TMan overlay (can be an empty object).
   * Subclasses of {@link TManOverlay} **must** implement this method.
   * @return {Object} The start descriptor used by the TMan overlay
   */
  _descriptor () {
    // throw new Error('A valid TMan based overlay must implement a _descriptor method to generate a base descriptor');
    return {};
  }

  /**
   * Give the delay **in milliseconds** after which the descriptor must be recomputed.
   * Subclasses of {@link TManOverlay} **must** implement this method.
   * @return {number} The delay **in milliseconds** after which the descriptor must be recomputed
   */
  _descriptorTimeout () {
    // throw new Error('A valid TMan based overlay must implement a _descriptorTimeout method to give the timeout on descriptors');
    return 10 * 1000;
  }

  /**
   * Compare two peers and rank them according to a ranking function.
   * This function must return `0 if peerA == peerB`, `1 if peerA < peerB` and `-1 if peerA > peerB`.
   *
   * Subclasses of {@link TManOverlay} **must** implement this method.
   * @param {*} self - The current peer that perform the evaluation
   * @param {*} peerA - The first peer
   * @param {*} peerB - The second peer
   * @return {integer} `0 if peerA == peerB`, `1 if peerA < peerB` and `-1 if peerA > peerB` (according to the ranking algorithm)
   */
  _rankPeers (self, foglet, peerA, peerB) {
    foglet._ping(peerA.peer).then((timeA) => {
      return foglet._ping(peerB.peer).then((timeB) => {
        //debug('Ping: ', timeA, timeB);
        if(timeA < timeB) return 1;
        if(timeA > timeB) return -1;
        return 0;
      }).catch(e => {
        //debug(e, 'Ping: one peer is unreachable peer', peerA.peer, ' win with ', timeA);
        return 1;
      });
    }).catch(e => {
      return foglet._ping(peerB.peer).then((timeB) => {
        //debug(e, 'Ping: one peer is unreachable peer', peerB.peer, ' win with', timeB);
        return -1;
      }).catch(e => {
        //debug(e, 'Ping: peers are unreachable. No one win.');
        return 0;
      });
    });
  }

  /**
   * Utility to rank two peers
   * @private
   */
  _rankingFunction () {
    return peer => (a, b) => this._rankPeers(peer, this, a, b);
  }

  /**
   * Get the IDs of all available neighbours
   * @param  {integer} limit - Max number of neighbours to look for
   * @return {string[]} Set of IDs for all available neighbours
   */
  getNeighbours (limit) {
    // BUG, sometimes our id is in our partial view.
    // Tempory fix by removing this element if in results
    let result = this.rps.getPeers(limit);
    // lremove(result, (elem) => {
    //   return elem === this.inviewId;
    // })
    return result;
  }

  /**
   * Utility: Ping the specified id
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
}

module.exports = TManLatenciesOverlay;
