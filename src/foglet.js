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

const EventEmitter = require('events');
const uuid = require('uuid/v4');
const lmerge = require('lodash.merge');
// const debug = require('debug')('foglet-core:main');

// NetworkManager
const NetworkManager = require('./network/network-manager.js');

// SSH Control
const SSH = require('./utils/ssh.js');

// Foglet default options
const DEFAULT_OPTIONS = {
  verbose: true, // want some logs ? switch to false otherwise
  rps: {
    type: 'spray-wrtc',
    options: {
      protocol: 'foglet-example-rps', // foglet running on the protocol foglet-example, defined for spray-wrtc
      webrtc:	{ // add WebRTC options
        trickle: true, // enable trickle (divide offers in multiple small offers sent by pieces)
        iceServers : [] // define iceServers in non local instance
      },
      timeout: 2 * 60 * 1000, // spray-wrtc timeout before definitively close a WebRTC connection.
      delta: 10 * 1000, // spray-wrtc shuffle interval
      signaling: {
        address: 'https://signaling.herokuapp.com/',
        // signalingAdress: 'https://signaling.herokuapp.com/', // address of the signaling server
        room: 'best-room-for-foglet-rps' // room to join
      }
    }
  },
  overlay: { // overlay options
    options: { // these options will be propagated to all components, but overrided if same options are listed in the list of overlays
      webrtc:	{ // add WebRTC options
        trickle: true, // enable trickle (divide offers in multiple small offers sent by pieces)
        iceServers : [] // define iceServers in non local instance
      },
      timeout: 2 * 60 * 1000, // spray-wrtc timeout before definitively close a WebRTC connection.
      delta: 10 * 1000 // spray-wrtc shuffle interval
    }, // options wiil be passed to all components of the overlay
    overlays: [
      // {
      //   class: 'latencies',
      //   options: {
      //     protocol: 'foglet-example-overlay-latencies', // foglet running on the protocol foglet-example, defined for spray-wrtc
      //     signaling: {
      //       address: 'https://signaling.herokuapp.com/',
      //       // signalingAdress: 'https://signaling.herokuapp.com/', // address of the signaling server
      //       room: 'best-room-for-foglet-overlay' // room to join
      //     }
      //   }
      // }
    ] // add an latencies overlay
  },
  ssh: undefined  /* {
    address: 'http://localhost:4000/'
  }*/
};

/**
 * A configuration object used to build an overlay
 * @typedef {Object} OverlayConfig
 * @property {string} class - Name of the overlay
 * @property {Object} options - Dedicated options used to build the overlay
 * @property {string} options.protocol - Name of the protocol run by the overlay
 * @property {Object} options.protocolsignaling - Options used to configure the interactions with the signaling server
 * @property {string} options.protocol.signaling.address - URL of the signaling server
 * @property {string} options.protocol.signaling.room - Name of the room in which the application run
 */

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
*     type: 'spray-wrtc', // we choose Spray as a our RPS
*     options: {
*       protocol: 'my-awesome-broadcast-application', // the name of the protocol run by our app
*       webrtc: { // some WebRTC options
*         trickle: true, // enable trickle
*         iceServers : [] // define iceServers here if you want to run this code outside localhost
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
  * @param {Object} options.rps - Options used to configure the Random Peer Sampling (RPS) network
  * @param {string} options.rps.type - The type of RPS (`spray-wrtc` for Spray or `fcn-wrtc` for a fully connected network over WebRTC)
  * @param {Object} options.rps.options - Options by the type of RPS choosed
  * @param {string} options.rps.options.protocol - Name of the protocol run by the application
  * @param {Object} options.rps.options.webrtc - WebRTC dedicated options (see WebRTC docs for more details)
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
    super();
    this._id = uuid();
    this._options = lmerge(DEFAULT_OPTIONS, options);
    this._networkManager = new NetworkManager(this._options);

    // SSH Control
    // currently disabled
    if (this._options.ssh && this._options.ssh.address) {
      this._ssh = new SSH({
        foglet: this,
        address: this._options.ssh.address
      });
      this._ssh.on('logs', (message, data) => this._log(data));
    }

  }

  /**
   * Get the foglet ID.
   *
   * **WARNING:** this id is not the same as used by the RPS.
   * @return {string} The foglet ID
   */
  get id () {
    return this._id;
  }

  /**
   * Get the in-view ID of this foglet
   * @return {string} The in-view ID of the foglet
   */
  get inViewID () {
    return this.getNetwork().network.inviewId;
  }

  /**
   * Get the out-view ID of this foglet
   * @return {string} The out-view ID of the foglet
   */
  get outViewID () {
    return this.getNetwork().network.outviewId;
  }

  /**
  * Connect the Foglet to the network.
  * If a parameter is supplied, the foglet try to connect with another foglet.
  *
  * Otherwise, it uses the signaling server to perform the connection.
  * In this case, one must call {@link Foglet#share} before, to connect the foglet to the signaling server first.
  *
  * By default, connect the foglet to the base RPS. Use the `index` parameter to select which network (rps or overlay) to connect with.
  * The RPS is always the first network, at `index = 0`.
  * Then, overlays are indexed by the order in which they were declared in the options, strating from `index = 1`
  * for the first overlay.
  * @param {Foglet} [foglet=null] - (optional) Foglet to connect with. Leav to `null` rely on the signaling server.
  * @param {integer} [index=0] - (optional) Index of the network to connect. Default to the RPS.
  * @param {number} [timeout=6000] - (optional) Connection timeout. Default to 6.0s
  * @return {Promise} A Promise fullfilled when the foglet is connected
  * @example
  * const foglet = new Foglet({
  *   // some options...
  * });
  * foglet.share();
  * foglet.connection().then(console.log).catch(console.err);
  */
  connection (foglet = null, index = 0, timeout = 60000) {
    if(foglet !== null)
      // console.log('dest: ', foglet._defaultOverlay().rps, 'src: ', this._defaultOverlay().rps);
      return this.getNetwork(index).signaling.connection(foglet.getNetwork().network.rps, timeout);
    return this.getNetwork(index).signaling.connection(foglet, timeout);
  }

  /**
   * Connect the foglet to the signaling server.
   *
   * By default, connect the RPS to the signaling server. Use the `index` parameter to select which network (rps or overlay) to connect.
   * he RPS is always the first network, at `index = 0`.
   * Then, overlays are indexed by the order in which they were declared in the options, strating from `index = 1`
   * for the first overlay.
   * @param  {integer} [index=0] - (optional) Index of the network to connect to the signaling server. Default to the RPS.
   * @return {void}
   */
  share (index = 0) {
    this.getNetwork(index).signaling.signaling();
  }

  /**
   * Revoke the connection with the signaling server.
   *
   * By default, disconnect the RPS from the signaling server. Use the `index` parameter to select which network (rps or overlay) to connect.
   * he RPS is always the first network, at `index = 0`.
   * Then, overlays are indexed by the order in which they were declared in the options, strating from `index = 1`
   * for the first overlay.
   * @param  {integer} [index=0] - (optional) Index of the network to disconnect from the signaling server. Default to the RPS.
   * @return {void}
   */
  unshare (index = 0) {
    this.getNetwork(index).signaling.unsignaling();
  }

  /**
   * Select and get an overlay to use for communication using its index.
   * The RPS is always the first network, at `index = 0`.
   * Then, overlays are indexed by the order in which they were declared in the options, strating from `index = 1`
   * for the first overlay.
   * @param  {integer} [index=0] - (optional) Index of the network to get. Default to the RPS.
   * @return {Network} Return the network for the given ID.
   * @example
   * const foglet = new Foglet({
   *  // some options...
   * });
   *
   * // Get the RPS
   * const rps = foglet.getNetwork();
   *
   * // Get the third overlay
   * const thirdOverlay = foglet.getNetwork(3);
   */
  getNetwork (index = 0) {
    return this._networkManager.use(index);
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
    this._networkManager.registerMiddleware(middleware, priority);
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
    this.getNetwork().communication.onBroadcast(callback);
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
    this.getNetwork().communication.onStreamBroadcast(callback);
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
    return this.getNetwork().communication.sendBroadcast(message);
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
    return this.getNetwork().communication.streamBroadcast(isReady);
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
    this.getNetwork().communication.onUnicast(callback);
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
    this.getNetwork().communication.onStreamUnicast(callback);
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
    return this.getNetwork().communication.sendUnicast(id, message);
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
    return this.getNetwork().communication.streamUnicast(id);
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
    return this.getNetwork().communication.sendMulticast(ids, message);
  }

  /**
  * Get the ID of a random neighbour
  * @return {string|null} The ID of a random neighbour, or `null` if not found
  */
  getRandomNeighbourId () {
    const peers = this.getNetwork().network.getNeighbours();
    if(peers.length === 0) {
      return null;
    } else {
      try {
        const random = Math.floor(Math.random() * peers.length);
        const result = peers[random];
        return result;
      } catch (e) {
        console.err(e);
        return null;
      }
    }
  }

  /**
  * Get the IDs of all available neighbours
  * @param {integer} limit - Max number of neighours to get
  * @return {string[]} Set of IDs for all available neighbours
  * @example
  * const foglet = new Foglet({
  *   // some options...
  * });
  *
  * // print the IDs of up to five neighbours
  * console.log(foglet.getNeighbours(5));
  *
  * // print the IDs of all neighbours
  * console.log(foglet.getNeighbours());
  */
  getNeighbours (limit = undefined) {
    return this.getNetwork().network.getNeighbours(limit);
  }

}

module.exports = Foglet;
