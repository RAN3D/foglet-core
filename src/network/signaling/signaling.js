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

const EventEmitter = require('events');
const io = require('socket.io-client');
const debug = require('debug')('foglet-core:signaling');
const lmerge = require('lodash/merge');
const uuid = require('uuid/v4');

/**
 * Socket io signaling, this class is in relation to foglet-signaling-server {@see https://github.com/RAN3D/foglet-signaling-server}
 * Allow direct connection to network or signaling connection via a signaling server
 * Expose a connection method in order to connect the peer.
 * @author Folkvir
 */
class Signaling extends EventEmitter {
  constructor (source, options) {
    super();
    if(!source || !options || !options.address || !options.room) {
      debug(options);
      throw new SyntaxError('Not enough parameters, need a source an address and a room.');
    }
    this.options = lmerge({
      address: 'http://localhost:3000/',
      origins: '*',
      room: uuid(),
      timeout: 20000
    }, options);
    this.network = source;
    this.source = source.rps;
  }

  connection (network, timeout = this.options.timeout) {
    if(!network && !this.signaling) return Promise.reject('There is no available connection to the server. Try to use the function signaling() before.');
    return new Promise((resolve, reject) => {
      try {
        if(network) {
          this.source.join(this.direct(this.source, network)).then(() => {
            this.emit('connected');
          }).catch(error => {
            if(error === 'connected') {
              this.emit('connected');
            } else {
              reject(error);
            }
          });
        } else {
          debug('Connecting to the room ' + this.options.room + '...');
          this.signaling.emit('joinRoom', { room: this.options.room  });

          this.signaling.on('joinedRoom', () => {
            debug('Connected to the room: ' + this.options.room);
            this.source.join(this._signalingInit()).then(() => {
              this.signaling.emit('connected', { room: this.options.room });
            }).catch(error => {
              if(error === 'connected') {
                this.emit('connected');
              } else {
                reject(error);
              }
            });
          });
        }
        this.once('connected', () => {
          resolve(true);
        });
        setTimeout(() => {
          reject('connection timed out.');
        }, timeout);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
  * Enable signaling exchange with a signaling server in order to allow new user to connect with us.
  * @return {void}
  */
  signaling () {
    //	Connection to the signaling server
    this.signaling = io.connect(this.options.address, {origins: this.options.origins});

    this.signaling.on('new_spray', (data) => {
      const signalingAccept = (offer) => {
        debug('Emit the accepted offer: ', offer);
        this.signaling.emit('accept', { offer, room: this.options.room });
      };
      debug('Receive a new offer: ', data);
      this.source.connect(signalingAccept, data);
    });
    this.signaling.on('accept_spray', (data) => {
      debug('Receive an accepted offer: ', data);
      this.source.connect(data);
    });
    this.signaling.on('connected', () => {
      debug('Peer connected.');
      this.emit('connected');
    });
  }

  /**
  * Disable signaling exchange and disconnect from the server
  * @return {void}
  */
  unsignaling () {
    this.signaling.emit('disconnect');
    this.signaling.removeAllListeners('new_spray');
    this.signaling.removeAllListeners('accept_spray');
    this.signaling.removeAllListeners('connected');
  }


  /**
   * @private
   * Enable direct connection between 2 peers
   * @param  {Object} src  Source
   * @param  {Object} dest Destination
   * @return {function} Function that connect the source to the destination
   */
  direct (src, dest) {
    return (offer) => {
      dest.connect( (answer) => {
        src.connect(answer);
      }, offer);
    };
  }

  /**
   * @private
   * Begin a signaling exchange
   * @return {[type]} [description]
   */
  _signalingInit () {
    return (offer) => {
      debug('Emit a new offer.');
      this.signaling.emit('new', {offer, room: this.options.room});
    };
  }
}

module.exports = Signaling;
