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
'use strict'

const EventEmitter = require('events')
const uuid = require('uuid/v4')
const lmerge = require('lodash.merge')

// experimental
// media
const MediaStream = require('./utils/media')

// NetworkManager
const NetworkManager = require('./network/network-manager.js')

// SSH Control
const SSH = require('./utils/ssh.js')

// Foglet default options
const DEFAULT_OPTIONS = () => {
  return {
    verbose: true, // want some logs ? switch to false otherwise
    rps: {
      type: 'cyclon',
      options: {
        protocol: 'foglet-example-rps', // foglet running on the protocol foglet-example, defined for spray-wrtc
        webrtc: { // add WebRTC options
          trickle: true, // enable trickle (divide offers in multiple small offers sent by pieces)
          config: {iceServers: []} // define iceServers in non local instance
        },
        timeout: 5 * 1000, // spray-wrtc timeout before definitively close a WebRTC connection.
        pendingTimeout: 60 * 1000,
        delta: 60 * 1000, // spray-wrtc shuffle interval
        maxPeers: 5,
        a: 1, // for spray: a*ln(N) + b, inject a arcs
        b: 5, // for spray: a*ln(N) + b, inject b arcs
        signaling: {
          address: 'https://signaling.herokuapp.com/',
          // signalingAdress: 'https://signaling.herokuapp.com/', // address of the signaling server
          room: 'best-room-for-foglet-rps' // room to join
        }
      }
    },
    overlays: [
      // {
      //   name: 'yourOverlayName' // required to the network using the overlay function of the foglet instance
      //   class: YourOverlayClass,
      //   options: {
      //     delta: 10 * 1000,
      //     protocol: 'foglet-example-overlay-latencies', // foglet running on the protocol foglet-example, defined for spray-wrtc
      //     signaling: {
      //       address: 'https://signaling.herokuapp.com/',
      //       // signalingAdress: 'https://signaling.herokuapp.com/', // address of the signaling server
      //       room: 'best-room-for-foglet-overlay' // room to join
      //     }
      //   }
      // }
    ],
    ssh: undefined /* {
      address: 'http://localhost:4000/'
    } */
  }
}

/**
 * A callback invoked when a message is received (either by unicast or broadcast)
 * @callback MessageCallback
 * @param {string} id - The ID of the peer who send the message
 * @param {object} message - The message received
 */

/**
* Foglet is the main class used to build fog computing applications.
*
* It serves as a High level API over a Random Peer Sampling (RPS) network, typically Spray ({@link https://github.com/RAN3D/spray-wrtc}).
* It provides utilities to send to other peers in the network, and to receives messages send to him by these same peers.
* Messages can be send to a single neighbour, in a **unicast** way, or to all peers in the network, in a **broadcast** way.
* @example
* 'use strict';
* const Foglet = require('foglet');
*
* // let's create a simple application that send message in broadcast
* const foglet = new Foglet({
*   rps: {
*     type: 'cyclon', // we choose Spray as a our RPS
*     options: {
*       protocol: 'my-awesome-broadcast-application', // the name of the protocol run by our app
*       webrtc: { // some WebRTC options
*         trickle: true, // enable trickle
*         config: {iceServers : []} // define iceServers here if you want to run this code outside localhost
*       },
*       signaling: { // configure the signaling server
*         address: 'http://signaling.herokuapp.com', // put the URL of the signaling server here
*         room: 'my-awesome-broadcast-application' // the name of the room for the peers of our application
*       }
*     }
*   }
* });
*
* // connect the foglet to the signaling server
* foglet.share();
*
* // Connect the foglet to our network
* foglet.connection().then(() => {
*   // listen for broadcast messages
*   foglet.onBroadcast((id, message) => {
*     console.log('The peer', id, 'just sent me by broadcast:', message);
*   });
*
*   // send a message in broadcast
*   foglet.sendBroadcast('Hello World !');
* });
* @author Grall Arnaud (folkvir)
*/
class Foglet extends EventEmitter {
  /**
  * Constructor of Foglet
  * @constructs Foglet
  * @param {Object} options - Options used to build the Foglet
  * @param {boolean} options.verbose - If True, activate logging
  * @param {boolean} options.id - Id of the foglet, will identify the peer as ID-I and ID-O in a neighbor view, respectively for Outgoing and ingoing arcs
  * @param {Object} options.rps - Options used to configure the Random Peer Sampling (RPS) network
  * @param {string} options.rps.type - The type of RPS (`spray-wrtc` for Spray, `cyclon` for Cyclon or `custom` for a custom network
  * @param {Object} options.rps.options - Options by the type of RPS choosed
  * @param {string} options.rps.options.protocol - Name of the protocol run by the application
  * @param {string} options.rps.options.maxPeers - Using Cyclon, fix the max number of peers in the partial view
  * @param {Object} options.rps.options.webrtc - WebRTC dedicated options (see SimplePeer @see(https://github.com/feross/simple-peer) WebRTC docs for more details)
  * @param {number} options.rps.options.timeout - RPS timeout before definitively close a WebRTC connection
  * @param {number} options.rps.options.delta - RPS shuffle interval
  * @param {Object} options.rps.options.signaling - Options used to configure the interactions with the signaling server
  * @param {string} options.rps.options.signaling.address - URL of the signaling server
  * @param {string} options.rps.options.signaling.room - Name of the room in which the application run
  * @param {Object} options.overlay - Options used to configure custom overlay in addition of the RPS
  * @param {Object} options.overlay.options - Options propagated to all overlays, same as the options field used to configure the RPS.
  * @param {OverlayConfig[]} options.overlay.overlays - Set of config objects used to build the overlays
  * @throws {InitConstructException} thrown when options are not provided
  * @throws {ConstructException} thrown when key options are missing
  * @returns {void}
  */
  constructor (options = {}) {
    super()
    this._options = lmerge(DEFAULT_OPTIONS(), options)
    // set a new id for the foglet
    if (!this._options.id) this._options.id = uuid()
    // the the id for the RPS, (using n2n-overlay-wrtc, this is .PEER in options)
    this._options.rps.options.peer = this._options.id
    // set the id as class variable for visibility
    this._id = this._options.id
    this._networkManager = new NetworkManager(this._options)

    // SSH Control
    // currently disabled
    if (this._options.ssh && this._options.ssh.address) {
      this._ssh = new SSH({
        foglet: this,
        address: this._options.ssh.address
      })
    }
  }

  /**
   * Get the foglet ID.
   *
   * **WARNING:** this id is not the same as used by the RPS.
   * @return {string} The foglet ID
   */
  get id () {
    return this._id
  }

  /**
   * Get the in-view ID of this foglet
   * @return {string} The in-view ID of the foglet
   */
  get inViewID () {
    return this.overlay().network.inviewId
  }

  /**
   * Get the out-view ID of this foglet
   * @return {string} The out-view ID of the foglet
   */
  get outViewID () {
    return this.overlay().network.outviewId
  }

  /**
  * Connect the Foglet to the network.
  * If a parameter is supplied, the foglet try to connect with another foglet.
  *
  * Otherwise, it uses the signaling server to perform the connection.
  * In this case, one must call {@link Foglet#share} before, to connect the foglet to the signaling server first.
  *
  * By default, connect the foglet to the base RPS. Use the `name` parameter to select which overlay to connect with.
  * @param {Foglet} [foglet=null] - (optional) Foglet to connect with. Leav to `null` rely on the signaling server.
  * @param {string} [name=null] - (optional) Name of the overlay to connect. Default to the RPS.
  * @param {number} [timeout=60000] - (optional) Connection timeout. Default to 6.0s
  * @return {Promise} A Promise fullfilled when the foglet is connected
  * @example
  * const foglet = new Foglet({
  *   // some options...
  * });
  * foglet.share();
  * foglet.connection().then(console.log).catch(console.err);
  */
  connection (foglet = null, name = null, timeout = this._options.pendingTimeout) {
    return new Promise((resolve, reject) => {
      if (foglet !== null) {
        this.overlay(name).signaling.connection(foglet.overlay(name).network, timeout).then((result) => {
          this.emit('connect')
          resolve(result.connected)
        }).catch(e => {
          reject(e)
        })
      } else {
        this.overlay(name).signaling.connection(null, timeout).then((result) => {
          this.emit('connect')
          resolve(result.connected)
        }).catch(e => {
          reject(e)
        })
      }
    })
  }

  /**
   * Connect the foglet to the signaling server.
   *
   * By default, connect the RPS to the signaling server. Use the `name` parameter to select which overlay to connect.
   * @param  {string} [name=null] - (optional) Name of the overlay to connect to the signaling server. Default to the RPS.
   * @return {void}
   */
  share (name = null) {
    this.overlay(name).signaling.signaling()
  }

  /**
   * Revoke the connection with the signaling server.
   *
   * By default, disconnect the RPS from the signaling server. Use the `name` parameter to select which overlay to connect.
   * @param  {integer} [name=null] - (optional) Name of the overlay to disconnect from the signaling server. Default to the RPS.
   * @return {void}
   */
  unshare (name = null) {
    this.overlay(name).signaling.unsignaling()
  }

  /**
   * Select and get an overlay to use for communication using its index.
   * The RPS is always provided when no parameter are provided.
   * Then, overlays are indexed by their name.
   * @param  {string} [name=null] - (optional) Name of the overlay to get. Default to the RPS.
   * @return {Network} Return the network for the given ID.
   * @example
   * const foglet = new Foglet({
   *  // some options...
   * });
   *
   * // Get the 'latencies' overlay
   * const overlay = foglet.overlay('latencies');
   */
  overlay (name = null) {
    return this._networkManager.overlay(name)
  }

  /**
   * Register a middleware, with an optional priority
   * @param  {Object} middleware   - The middleware to register
   * @param  {function} middleware.in - Function applied on middleware input
   * @param  {function} middleware.out - Function applied on middleware output
   * @param  {Number} [priority=0] - (optional) The middleware priority
   * @return {void}
   * @example
   * const foglet = new Foglet({
   *  // some options...
   * });
   *
   * const middleware = {
   *  in: msg => {
   *    return msg + ' and Thanks';
   *  },
   *  out: msg => {
   *    return msg + ' for all the Fish';
   *  }
   * };
   *
   * foglet.use(middleware);
   */
  use (middleware, priority = 0) {
    this._networkManager.registerMiddleware(middleware, priority)
  }

  /**
  * Listen for incoming **broadcast** messages, and invoke a callback on each of them.
  * @param {MessageCallback} callback - Callback function inovked with the message
  * @returns {void}
  * @example
  * const foglet = new Foglet({
  *   // some options...
  * });
  *
  * foglet.onBroadcast((id, msg) => {
  *   console.log('The peer', id, 'just sent by broadcast:', msg);
  * });
  **/
  onBroadcast (callback) {
    this.overlay().communication.onBroadcast(callback)
  }

  /**
  * Listen on incoming unicasted streams
  * @param  {MessageCallback} callback - Callback invoked with a {@link StreamMessage} as message
  * @return {void}
  * @example
  * const foglet = getSomeFoglet();
  *
  * foglet.onStreamBroadcast((id, stream) => {
  *  console.log('a peer with id = ', id, ' is streaming data to me');
  *  stream.on('data', data => console.log(data));
  *  stream.on('end', () => console.log('no more data available from the stream'));
  * });
  */
  onStreamBroadcast (callback) {
    this.overlay().communication.onStreamBroadcast(callback)
  }

  /**
  * Send a broadcast message to all connected peers in the network.
  * @param {object} message - The message to send
  * @return {boolean} True if the messahe has been sent, False otherwise
  * @example
  * const foglet = new Foglet({
  *   // some options...
  * });
  *
  * foglet.sendBroadcast('Hello everyone!');
  */
  sendBroadcast (message) {
    return this.overlay().communication.sendBroadcast(message)
  }

  /**
  * Begin the streaming of a message to all peers (using broadcast)
  * @param  {VersionVector} [isReady=undefined] - Id of the message to wait before this message is received
  * @return {StreamRequest} Stream used to transmit data to all peers
  * @example
  * const foglet = getSomeFoglet();
  *
  * const stream = foglet.sendBroadcast();
  * stream.write('Hello');
  * stream.write(' world!');
  * stream.end();
  */
  streamBroadcast (isReady = undefined) {
    return this.overlay().communication.streamBroadcast(isReady)
  }

  /**
  * Listen for incoming **unicast** messages, and invoke a callback on each of them.
  * @param {MessageCallback} callback - Callback function inovked with the message
  * @return {void}
  * @example
  * const foglet = new Foglet({
  *   // some options...
  * });
  *
  * foglet.onUnicast((id, msg) => {
  *   console.log('My neighbour', id, 'just sent me by unicast:', msg);
  * });
  **/
  onUnicast (callback) {
    this.overlay().communication.onUnicast(callback)
  }

  /**
  * Listen on incoming unicasted streams
  * @param  {MessageCallback} callback - Callback invoked with a {@link StreamMessage} as message
  * @return {void}
  * @example
  * const foglet = getSomeFoglet();
  *
  * foglet.onStreamUnicast((id, stream) => {
  *  console.log('a peer with id = ', id, ' is streaming data to me');
  *  stream.on('data', data => console.log(data));
  *  stream.on('end', () => console.log('no more data available from the stream'));
  * });
  */
  onStreamUnicast (callback) {
    this.overlay().communication.onStreamUnicast(callback)
  }

  /**
  * Send a message to a specific neighbour (in a **unicast** way).
  * @param {string} id - The ID of the targeted neighbour
  * @param {object} message - The message to send
  * @return {boolean} True if the messahe has been sent, False otherwise
  * @example
  * const foglet = new Foglet({
  *   // some options...
  * });
  *
  * // get the ID of one neighbour
  * const id = foglet.getRandomNeighbourId();
  *
  * foglet.sendUnicast(id, 'Hi diddly ho neighborino!');
  */
  sendUnicast (id, message) {
    return this.overlay().communication.sendUnicast(id, message)
  }

  /**
  * Begin the streaming of a message to another peer (using unicast)
  * @param  {string} id - Id of the peer
  * @return {StreamRequest} Stream used to transmit data to another peer
  * @example
  * const foglet = getSomeFoglet();
  * const peerID = getSomePeerID();
  *
  * const stream = foglet.streamUnicast(peerID);
  * stream.write('Hello');
  * stream.write(' world!');
  * stream.end();
  */
  streamUnicast (id) {
    return this.overlay().communication.streamUnicast(id)
  }

  /**
  * Send a message to a set of neighbours (in a **multicast** way).
  * These messages will be received by neighbours on the **unicast** channel.
  * @param {string[]} ids - The IDs of the targeted neighbours
  * @param {object} message - The message to send
  * @return {boolean} True if the messahe has been sent, False otherwise
  * @example
  * const foglet = new Foglet({
  *   // some options...
  * });
  *
  * // get IDs of some neighbours
  * const ids = foglet.getNeighbours(5);
  *
  * foglet.sendMulticast(ids, 'Everyone, get in here!');
  */
  sendMulticast (ids = [], message) {
    return this.overlay().communication.sendMulticast(ids, message)
  }

  /**
   * Create an object media stream with sendUnicast and sendBroadcast methods
   * @param  {[type]} [overlayname=null] The name of the overlay to use for send messages
   * @param {Object} [options={}] the options to use for creating the media manager (default chunkSize=128k)
   * @return {MediaStream}
   */
  createMedia (overlayname = null, options = {}) {
    // experimental media send/receive stream
    console.warn('[Warning] these methods are experimental.')
    return new MediaStream(this.overlay(overlayname).network, this.overlay(overlayname).network.protocol, options)
  }

  /**
  * Get the ID of a random neighbour
  * @return {string|null} The ID of a random neighbour, or `null` if not found
  */
  getRandomNeighbourId () {
    const peers = this.overlay().network.getNeighbours()
    if (peers.length === 0) {
      return null
    } else {
      try {
        const random = Math.floor(Math.random() * peers.length)
        const result = peers[random]
        return result
      } catch (e) {
        console.error(e)
        return null
      }
    }
  }

  /**
   * Return an array with all arcs Ids (i.e.: all connection availables)
   * @param  {[type]} [overlayName=undefined] Define the overlay to use
   * @return {String[]} Array of ids
   * @example
   * const foglet = new Foglet();
   *
   * // print the IDs of up to five neighbours
   * console.log(foglet.getArcs());
   * // will return ['peer1-O', 'peer2-I', 'peer2-O', 'peer3-I'...]
   */
  getArcs (overlayName = undefined) {
    return this.overlay(overlayName = undefined).network.getArcs()
  }

  /**
  * Get the IDs of all available neighbours with or without their suffix -I or -O
  * @param  {Boolean} [transform=true] - enable the transformation of ids eg: 'peer' or 'peer-O'
  * @param {String} [overlayName=undefined] - Define the overlay to use
  * @return {String[]} Set of IDs for all available neighbours
  * @example
  * const foglet = new Foglet({
  *   // some options...
  * });
  *
  * // print the IDs of up to five neighbours
  * console.log(foglet.getReachableNeighbours());
  * // will return ['peer1-O', 'peer2-O', 'peer3-O', ...]
  * // print the IDs of all neighbours
  * console.log(foglet.getReachableNeighbours(false));
  * // will return ['peer1', 'peer2', 'peer3', ...]
  */
  getReachableNeighbours (transform = true, overlayName = undefined) {
    return this.overlay(overlayName).network.getReachableNeighbours(transform)
  }

  /**
  * Get the IDs of all available neighbours with or without their suffix -I or -O
  * @param  {Integer} [limit=undefined] - Max number of neighbours to look for
  * @param {String} [overlayName=undefined] - Define the overlay to use
  * @return {String[]} Set of IDs for all available neighbours
  * @example
  * const foglet = new Foglet({
  *   // some options...
  * });
  *
  * // print the IDs of up to five neighbours
  * console.log(foglet.getNeighbours());
  * // will return ['peer1-I', 'peer2-I', 'peer3-I', ...]
  * // print the IDs of all neighbours
  * console.log(foglet.getNeighbours(Infinity));
  * // will return ['peer1-I', 'peer1-O', 'peer3-I', ...]
  */
  getNeighbours (limit = undefined, overlayName = undefined) {
    return this.overlay(overlayName).network.getNeighbours(limit)
  }
}

module.exports = Foglet
