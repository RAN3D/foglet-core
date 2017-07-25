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
const lmerge = require('lodash/merge');
// const debug = require('debug')('foglet-core:main');

// NetworkManager
const NetworkManager = require('./network/network-manager.js');

// SSH COntrol
const SSH = require('./utils/ssh.js');

// Middleware
const MiddlewareRegistry = require('./utils/middleware-registry.js');

/**
* Create a Foglet Class (facade pattern)
* @class Foglet
* @author Grall Arnaud (folkvir)
*/
class Foglet extends EventEmitter {
  /**
  * Constructor of Foglet
  * @constructs Foglet
  * @param {object} options - it's an object representing options avalaible
  * @throws {InitConstructException} If options is undefined
  * @throws {ConstructException} spray, protocol and room must be defined.
  * @example
  * var f = new Foglet({
  * 	spray: new Spray()
  * 	room: "your-room-name"
  * })
  * @returns {void}
  */
  constructor (options = {}) {
    super();
    this.defaultOptions = {
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
      overlay:{ // overlay options
        enable:false, // want to activate overlay ? switch to false otherwise
        options: { // these options will be propagated to all components, but overrided if same options are listed in the list of overlays
          webrtc:	{ // add WebRTC options
            trickle: true, // enable trickle (divide offers in multiple small offers sent by pieces)
            iceServers : [] // define iceServers in non local instance
          },
          timeout: 2 * 60 * 1000, // spray-wrtc timeout before definitively close a WebRTC connection.
          delta: 10 * 1000 // spray-wrtc shuffle interval
        }, // options wiil be passed to all components of the overlay
        type: [
          {
            class: 'latencies',
            options: {
              protocol: 'foglet-example-overlay-latencies', // foglet running on the protocol foglet-example, defined for spray-wrtc
              signaling: {
                address: 'https://signaling.herokuapp.com/',
                // signalingAdress: 'https://signaling.herokuapp.com/', // address of the signaling server
                room: 'best-room-for-foglet-overlay' // room to join
              }
            }
          }
        ] // add an latencies overlay
      },
      ssh: undefined  /*{
        address: 'http://localhost:4000/'
      }*/
    };
    this.options = lmerge(this.defaultOptions, options);
    this.id = uuid();

    // add the network part !
    this.networkManager = new NetworkManager(this.options);

    // Middlewares
    this._middlewares = new MiddlewareRegistry();

    // SSH COntrol
    if (this.options.ssh && this.options.ssh.address) {
      this.ssh = new SSH({
        foglet: this,
        address: this.options.ssh.address
      });
      this.ssh.on('logs', (message, data) => this._log(data));
    }

  }

  get inviewId () {
    return this.getNetwork().network.inviewId;
  }

  get outviewId () {
    return this.getNetwork().network.outviewId;
  }

  /**
  * Connection method for Foglet to the network specified by protocol and room options
  * Firstly we connect the RPS then we added overlays specified in options
  * @param {Foglet} foglet Foglet to connect, none by default and the connection is by signaling. Otherwise it uses a direct callback
  * @param {number} timeout Time before rejecting the promise.
  * @function connection
  * @return {Promise} Return a Q.Promise
  * @example
  * var f = new Foglet({...});
  * f.connection().then((response) => console.log).catch(error => console.err);
  */
  connection (foglet = undefined, timeout = 60000) {
    if(foglet) {
      // console.log('dest: ', foglet._defaultOverlay().rps, 'src: ', this._defaultOverlay().rps);
      return this.getNetwork().signaling.connection(foglet.getNetwork().network.rps, timeout);
    } else {
      return this.getNetwork().signaling.connection(foglet, timeout);
    }
  }

  /**
   * Enable the signaling share system, peer will connect to us.
   * @return {void}
   */
  share () {
    this.getNetwork().signaling.signaling();
  }

  /**
   * Disable the signaling share system, peer will be not able to connect with us.
   * @return {void}
   */
  unshare () {
    this.getNetwork().signaling.unsignaling();
  }

  /**
   * Return the specified overlay by its id, if index not specified, return the rps
   * @param {string} id Index of a network, default: index of the last overlay added or 0 (the rps) if no overlay
   * @return {object} Return the network to use
   */
  getNetwork (index = undefined) {
    return this.networkManager.use(index);
  }

  /**
   * Register a middleware, with an optional priority
   * @param  {Object} middleware   - The middleware to register
   * @param  {function} middleware.in - Function applied on middleware input
   * @param  {function} middleware.out - Function applied on middleware output
   * @param  {Number} [priority=0] - (optional) The middleware priority
   * @return {void}
   */
  use (middleware, priority = 0) {
    this._middlewares.register(middleware, priority);
  }

  /**
  * This callback is a parameter of the onBroadcast function.
  * @callback callback
  * @param {string} id - sender id
  * @param {object} message - the message received
  */
  /**
  * Allow to listen on Foglet when a broadcasted message arrived
  * @function onBroadcast
  * @param {string} signal - The signal we will listen to.
  * @param {callback} callback - Callback function that handles the response
  * @returns {void}
  **/
  onBroadcast (callback) {
    this.getNetwork().communication.onBroadcast((id, msg) => callback(id, this._middlewares.out(msg)));
  }


  /**
  * Send a broadcast message to all connected clients.
  * @function sendBroadcast
  * @param {object} msg - Message to send.
  * @returns {void}
  */
  sendBroadcast (msg) {
    return this.getNetwork().communication.sendBroadcast(this._middlewares.in(msg));
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
    this.getNetwork().communication.onUnicast((id, msg) => callback(id, this._middlewares.out(msg)));
  }

  /**
  * Send a message to a specific neighbour (id)
  * @function sendUnicast
  * @param {object} message - The message to send
  * @param {string} id - One of your neighbour's id
  * @return {boolean} return true if it seems to have sent the message, false otherwise.
  */
  sendUnicast (id, message) {
    return this.getNetwork().communication.sendUnicast(id, this._middlewares.in(message));
  }

  /**
  * Send a message to a specific neighbour (id)
  * @function sendUnicast
  * @param {object} message - The message to send
  * @param {string} id - One of your neighbour's id
  * @return {boolean} return true if it seems to have sent the message, false otherwise.
  */
  sendMulticast (ids = [], message) {
    return this.getNetwork().communication.sendMulticast(ids, this._middlewares.in(message));
  }

  /**
  * Get a random id of my current neighbours
  * @function getRandomPeerId
  * @return {string} return an id or a null string otherwise
  */
  getRandomNeighbourId () {
    const peers = this.getNetwork().network.getNeighbours();
    if(peers.length === 0) {
      return '';
    } else {
      try {
        const random = Math.floor(Math.random() * peers.length);
        const result = peers[random];
        return result;
      } catch (e) {
        console.err(e);
        return '';
      }
    }
  }

  /**
  * Get a list of all available neighbours in the outview
  * @function getNeighbours
  * @return {array}  Array of string representing neighbours id, if no neighbours, return an empty array
  */
  getNeighbours (k = undefined) {
    return this.getNetwork().network.getNeighbours(k);
  }

}

module.exports = { Foglet, uuid };
