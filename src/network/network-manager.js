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

// lodash utils
const lmerge = require('lodash.merge');

// Networks
const Network = require('./network.js');
const SprayAdapter = require('./rps/sprayAdapter.js');
const LatenciesOverlay = require('./overlay/latencies-overlay.js');

// debug
const debug = require('debug')('foglet-core:network-manager');

/**
 * A NetworkManager manage several distinct {@link Network} instances, i.e. a RPS and a set of overlays,
 * and allow peers to choose which network they want to interact with.
 * @extends EventEmitter
 * @author Grall Arnaud (folkvir)
 */
class NetworkManager extends EventEmitter {
  /**
   * Constructor
   * @param  {Object} options - Options used to build the networks
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
   */
  constructor (options) {
    super();
    this._options = lmerge({
      rps: {
        type: 'spray-wrtc',
        options: { // options will be passed to all components of the rps
          protocol: 'spray-wrtc-communication'
        }
      },
      overlay: {
        overlays: [], // string id or your overlay class reference
        options: {} // options will be passed to all components of the overlay
      }
    }, options);

    // construct the rps => this._rps = ....
    this._rps = this._constructRps(this._options.rps.type, this._options.rps.options);

    // construct overlay(s)
    this._overlays = [];
    this._constructOverlays(this._options.overlay.overlays, this._options.overlay.options);

    debug('Networks (Rps and overlays) initialized.');
  }

  /**
   * Select and get an overlay to use for communication using its index.
   * The RPS is always the first network, at `index = 0`.
   * Then, overlays are indexed by the order in which they were declared in the options, starting from `index = 1`
   * for the first overlay.
   * @param  {integer} [index=0] - (optional) Index of the network to get. Default to the RPS.
   * @return {Network} Return the selected network to use.
   */
  use (index = 0) {
    if(index === 0 || index < this._overlays.length)
      return this._rps;
    return this._overlays[index - 1];
  }

  /**
   * Register a middleware, with an optional priority
   * @param  {Object} middleware   - The middleware to register
   * @param  {function} middleware.in - Function applied on middleware input
   * @param  {function} middleware.out - Function applied on middleware output
   * @param  {Number} [priority=0] - (optional) The middleware priority
   * @return {void}
   */
  registerMiddleware (middleware, priority = 0) {
    this._rps.use(middleware, priority);
    this._overlays.forEach(overlay => overlay.use(middleware, priority));
  }

  /**
   * Construct the RPS by its type and options
   * @private
   * @param  {string} type    - Type of the RPS (spray-wrtc/fcn-wrtc/...)
   * @param  {Object} options - Options of the RPS
   * @param  {string} options.protocol - Name of the protocol run by the RPS
   * @param  {Object} options.signaling - Options used to configure the interactions with the signaling server
   * @param  {string} options.signaling.address - URL of the signaling server
   * @param  {string} options.signaling.room - Name of the room in which the application run
   * @return {Network} The constructed RPS
   */
  _constructRps (type, options) {
    const rpsClass = this._chooseRps(type);
    const rps = new rpsClass(options);
    return new Network(rps, options.signaling, options.protocol);
  }

  /**
   * Get a RPS constructor given its type in string format
   * @private
   * @param  {string} type - RPS type
   * @return {function} The RPS constructor
   */
  _chooseRps (type) {
    let rps = null;
    switch(type) {
    case 'spray-wrtc':
      rps = SprayAdapter;
      break;
    default:
      rps = SprayAdapter;
      break;
    }
    return rps;
  }

  /**
   * Construct all overlays specified
   * @private
   * @param  {OverlayConfig[]} overlays - Set of objects describing the overlays to build
   * @param  {Object} options - Options propagated to all overlays, same as the options field used to configure the RPS.
   * @return {void}
   */
  _constructOverlays (overlays, options) {
    if(overlays.length > 0) {
      overlays.forEach(config => {
        this._addOverlay(config, options.options);
      });
    } else {
      debug('No overlays added, only the base RPS is available');
    }
  }

  /**
   * Get an Overlay constructor given its type in string format
   * @private
   * @param  {string} type - Overlay type
   * @return {function} The Overlay constructor
   */
  _chooseOverlay (type) {
    let overlay = null;
    switch(type) {
    case 'latencies':
      overlay = LatenciesOverlay;
      break;
    }
    return overlay;
  }

  /**
   * Add an overlay to the our list of overlays: construct the overlay, and connect it to the network by using the connection() Promise.
   * Return the overlay id after its initialization
   * @private
   * @param {Overlay|string} overlay Class Overlay, THIS IS NOT AN OBJECT ALREADY INITIALIZED ! THIS A REFERENCE TO THE CLASS Overlay, Or it can be a string representing the id of a default Implemented overlay
   * @return {Promise<string>} A Promise resolved with the ID of the new overlay
   */
  _addOverlay (overlay, globalOptions) {
    debug(overlay, globalOptions);
    if(typeof overlay !== 'object')
      throw new SyntaxError('An overlay is an object {class: ..., options: {...}}');
    let objNetwork = undefined;
    // override and merge of global options with specified options
    let options = lmerge(globalOptions, overlay.options);
    options.manager = this;
    if(typeof overlay.class === 'function') {
      let net = new overlay.class(options);
      objNetwork = new Network(net, options.signaling, options.protocol);
    } else if( typeof overlay.class === 'string' ) {
      let overlord = this._chooseOverlay(overlay.class);
      if(!overlord)
        throw new Error('No overlay available for this string id.');
      try {
        // initialization of the the overlay.
        let net = new overlord(options);
        objNetwork = new Network(net, options.signaling, options.protocol);
        // Each default overlay has a specific id, fits this id to ids overlays/rps id in our list of overlay
      } catch (e) {
        throw e;
      }
    } else {
      // push this overlay to our list
      throw new Error('overlay have to class reference or an available string id');
    }
    this._overlays.push(objNetwork);
  }
}

module.exports = NetworkManager;
