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
    this.status = 'disconnected';
    debug(this);
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
          this._signalingJoinRoom(this.options.room);
          this._signalingjoinOnRoom(() => {
            this.source.join(this._signalingInit()).then(() => {
              this._signalingConnected(this.options.room);
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
          this.status = 'connected';
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
  * Enable signaling exchange with a signaling server in order to allow new user to connect with us.
  * @return {void}
  */
  signaling () {
    //	Connection to the signaling server
    this.signaling = io.connect(this.options.signalingAdress, {origins: this.options.origins});

    this.signaling.on('new_spray', (data) => {
      const signalingAccept = (offer) => {
        debug('Emit the accepted offer: ', offer);
        this.signaling.emit('accept', { offer, room: this.options.room });
      };
      debug('Receive a new offer: ', data);
      this.source.rps.connect(signalingAccept, data);
    });
    this.signaling.on('accept_spray', (data) => {
      debug('Receive an accepted offer: ', data);
      this.source.rps.connect(data);
    });

    this.signaling.on('connected', () => {
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
   * Signal to the server that we want to join a room
   * @param  {string} room The room to join
   * @return {void}
   */
  _signalingJoinRoom (room) {
    this.signaling.emit('joinRoom', { room });
  }

  /**
   * @private
   * Signal to the server that we are connected
   * @param  {signaling} room The room to signal that we are connected
   * @return {void}
   */
  _signalingConnected (room) {
    this.signaling.emit('connected', { room });
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
