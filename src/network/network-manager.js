'use strict';

const EventEmitter = require('events');

// lodash utils
const lmerge = require('lodash/merge');
const llast = require('lodash/last');

// Networks
const Network = require('./network.js');
const FcnAdapter = require('./rps/fcnAdapter.js');
const SprayAdapter = require('./rps/sprayAdapter.js');
const LatenciesOverlay = require('./overlay/latencies-overlay.js');

// debug
const debug = require('debug')('foglet-core:network-manager');

/**
 * A network is composed of a RPS/Overlay a signaling part and a communication part
 */
class NetworkManager extends EventEmitter {
  constructor (options) {
    super();
    this.options = lmerge({
      rps: {
        type: 'spray-wrtc',
        options: { // options wiil be passed to all components of the rps
          protocol: 'spray-wrtc-communication'
        }
      },
      overlay: {
        enable: false,
        type: [], // string id or your overlay class reference
        options: { }// options wiil be passed to all components of the overlay
      }
    }, options);

    // construct the rps => this.rps = ....
    this._constructRps(this.options.rps.type, this.options.rps.options);

    // construct overlay
    this.overlays = [];
    this._constructOverlays(this.options.overlay);

    debug('Networks (Rps and overlays) initialized.');
  }

  /**
   * Use a network, by default the last overlay added is your default network,
   * If you specify an index beginning by 0 representing the rps, you can use any network you added.
   * @param {number} index Index of the rps/overlay
   * @return {Network} Return a network to use.
   */
  use (index) {
    // if no index, or no overlays
    if(!index) {
      if(this.overlays.length === 0) return this.rps;
      return llast(this.overlays);
    } else {
      if(this.overlays.length === 0) return this.rps;
      return this.overlays[index];

    }
  }

  /**
   * Construct the RPS by its type and options
   * @param  {string} type    type of the RPS, spray-wrtc/fcn-wrtc/...
   * @param  {Object} options Options of the RPS
   * @return {}
   */
  _constructRps (type, options) {
    let rpsClass = this._chooseRps(type);
    let rps = new rpsClass(options);
    this.rps = new Network(rps, options);
  }

  /**
   * @private
   * Return a RPS class reference
   * @param  {string} type RPS type
   * @return {}
   */
  _chooseRps (type) {
    let rps = null;
    switch(type) {
    case 'fcn-wrtc':
      rps = FcnAdapter;
      break;
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
   * @private
   * Construct all overlays speicified;
   * @param  {Object} options Overlay options specified
   * @return {void}
   */
  _constructOverlays (options) {
    if(options.enable) {
      let overlayNumber = options.type.length;
      for(let i = 0; i < overlayNumber; ++i) {
        this._addOverlay(options.type[0], options.options);
      }
    } else {
      debug('Overlay not enabled, RPS only available.');
    }
  }

  /**
   * @private
   * Return an Overlay class reference
   * @param  {string} type Overlay type
   * @return {}
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
   * @private
   * Add an overlay to the our list of overlays, construct the overlay, and connect the overlay to the network by using the connection() Promise.
   * Return the overlay id after its construction, initialization
   * @param {Overlay|string} overlay Class Overlay, THIS IS NOT AN OBJECT ALREADY INITIALIZED ! THIS A REFERENCE TO THE CLASS Overlay, Or it can be a string representing the id of a default Implemented overlay
   * @return {Promise<string>} id Id of the new overlay
   */
  _addOverlay (overlay, globalOptions) {
    debug(overlay, globalOptions);
    if(typeof overlay !== 'object') throw new SyntaxError('An overlay is an object {class: ..., options: {...}}');
    let objNetwork = undefined;
    // override and merge of global options with specified options
    let options = lmerge(globalOptions, overlay.options);
    options.manager = this;
    if(typeof overlay.class === 'function') {
      let net = new overlay(options);
      objNetwork = new Network(net, options);
    } else if( typeof overlay.class === 'string' ) {
      let overlord = this._chooseOverlay(overlay.class);
      if(!overlord) {
        return Promise.reject(new Error('No overlay available for this string id.'));
      }
      try {
        // initialization of the the overlay.
        let net = new overlord(options);
        objNetwork = new Network(net, options);
        // Each default overlay has a specific id, fits this id to ids overlays/rps id in our list of overlay
      } catch (e) {
        return Promise.reject(e);
      }
    } else {
      // push this overlay to our list
      return Promise.reject(new Error('overlay have to class reference or an available string id'));
    }
    this.overlays.push(objNetwork);
    return Promise.resolve();
  }
}

module.exports = NetworkManager;
