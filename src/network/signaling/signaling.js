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
'use strict'

const EventEmitter = require('events')
const SocketIo = require('socket.io-client')
const debug = (require('debug'))('foglet-core:signaling')
const lmerge = require('lodash.merge')
const uuid = require('uuid/v4')

/**
 * Signaling is an interface with a signaling server with the same APi as `foglet-signaling-server` {@see https://github.com/RAN3D/foglet-signaling-server}.
 *
 * It allow for direct connection between peers, or for connection through a signaling server.
 * @extends EventEmitter
 * @author Folkvir
 */
class Signaling extends EventEmitter {
  /**
   * Constructor
   * @param {AbstractNetwork} source - The source RPS/network
   * @param {Object} options - Options used to configure the connection to the signaling server
   * @param {string} options.address - URL of the signaling server
   * @param {string} options.room - Name of the room in which the application run
   */
  constructor (source, options) {
    super()
    if (!source || !options || !options.address || !options.room) {
      debug(options)
      throw new SyntaxError('Not enough parameters, need a source an address and a room.')
    }
    this.options = lmerge({
      address: 'http://localhost:3000/',
      origins: '*',
      room: uuid(),
      timeout: 20000,
      io: SocketIo,
      reconnectionAttempts: 10
    }, options)
    debug('Signaling options: ', this.options)
    this._network = source
    this._id = this._network.id
    this._source = source.rps
    this._socket = this.options.io(this.options.address, {
      autoConnect: false,
      origins: this.options.origins,
      reconnectionAttempts: this.options.reconnectionAttempts,
      timeout: this.options.timeout
    })
    this._socket.on('connect_timeout', (timeout) => {
      this.unsignaling()
      this._manageTimeout(timeout)
    })
    this._socket.on('connect_error', (error) => {
      this.unsignaling()
      this._manageConnectionError(error)
    })
    this._socket.on('error', (error) => {
      this.unsignaling()
      this._manageError(error)
    })
    this._socket.on('disconnect', (reason) => {
      this._manageDisconnection(reason)
    })
    this._socket.on('new_spray', (data) => {
      const signalingAccept = offer => {
        debug('Emit the accepted offer: ', offer)
        this._socket.emit('accept', { id: this._id, offer, room: this.options.room })
      }
      debug('Receive a new offer: ', data)
      this._source.connect(signalingAccept, data)
    })
    this._socket.on('accept_spray', (data) => {
      debug('Receive an accepted offer: ', data)
      this._source.connect(data)
    })
  }

  /**
   * Connect the peer to the network.
   * If no peer is supplied, rely on the signaling server to connect the peer to the network.
   * @param {AbstractNetwork|null} network - (optional) Network to connect with. If not supplied, use the signaling server instead.
   * @param {number} timeout - (optional) Timeout for the interactions with the signaling server
   * @return {Promise} A promise fullfilled when the connection is established or failed.
   */
  connection (network = null, timeout = this.options.timeout) {
    if (network === null && this._socket === null) { return Promise.reject(new Error('There is no available connection to the server. Try to use the function signaling() before.')) }
    return new Promise((resolve, reject) => {
      const timeoutID = setTimeout(() => {
        reject(new Error('connection timed out.'))
      }, timeout)
      const done = (alone = false) => {
        clearTimeout(timeoutID)
        resolve({connected: true, alone})
      }
      const handleError = error => {
        if (error === 'connected') {
          done()
        } else {
          clearTimeout(timeoutID)
          reject(error)
        }
      }

      try {
        if (network) {
          this._source.join(this.direct(this._network.rps, network.rps)).then(() => {
            done()
          }).catch(handleError)
        } else {
          debug('Connecting to the room ' + this.options.room + '...')
          this._socket.emit('joinRoom', { id: this._id, room: this.options.room })
          this._socket.on('joinedRoom', (response) => {
            if (response.connected) {
              done(true)
            } else {
              this._source.join(this._signalingInit()).then(() => {
                this._socket.emit('connected', { id: this._id, room: this.options.room })
              }).catch(handleError)
              this._socket.once('connected', () => {
                debug('Peer connected.')
                done()
              })
            }
            debug('Connected to the room: ' + this.options.room)
          })
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
  * Enable signaling exchange with a signaling server in order to allow new user to connect with us.
  * @return {void}
  */
  signaling () {
    debug('Connection to the signaling server...')
    this._socket.open()
  }

  /**
  * Disable signaling exchange and disconnect from the server
  * @return {void}
  */
  unsignaling () {
    debug('Disconnection from the signaling server...')
    this._socket.emit('disconnect')
    this._socket.removeAllListeners('connected')
    this._socket.removeAllListeners('joinedRoom')
    this._socket.close()
  }

  /**
   * Enable direct connection between 2 peers
   * @private
   * @param  {Object} src  Source
   * @param  {Object} dest Destination
   * @return {function} Function that connect the source to the destination
   */
  direct (src, dest) {
    return offer => {
      dest.connect(answer => {
        src.connect(answer)
      }, offer)
    }
  }

  /**
   * Begin a signaling exchange
   * @private
   * @return {function} The function used to handle an offer
   */
  _signalingInit () {
    console.log(this._id)
    const self = this
    return offer => {
      debug('Emit a new offer.')
      this._socket.emit('new', {id: self._id, tid: uuid(), offer, room: this.options.room})
    }
  }

  /**
   * Manage when a timeout occures
   * @param  {Object} timeout Timeout error returned by socket.io
   * @return {void}
   */
  _manageTimeout (timeout) {
    debug(timeout)
  }

  /**
   * Manage when an error occures
   * @param  {Object} error Error returned by socket.io
   * @return {void}
   */
  _manageError (error) {
    debug(error)
  }

  /**
   * Manage when a disconnection occures
   * @param  {Object} reason Reason of the disconnection returned by socket.io
   * @return {void}
   */
  _manageDisconnection (reason) {
    debug(reason)
  }

  /**
   * Manage when a connection error occures
   * @param  {Object} error Reason of the connection error returned by socket.io
   * @return {void}
   */
  _manageConnectionError (error) {
    debug(error)
  }
}

module.exports = Signaling
