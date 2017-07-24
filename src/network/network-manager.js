'use strict';

const EventEmitter = require('events');

// lodash utils
const lmerge = require('lodash/merge');
// const llast = require('lodash/last');
// const lfind = require('lodash/find');
// const ldropRight = require('lodash/dropRight');
// const lfindIndex = require('lodash/findIndex');
// const lpullAt = require('lodash/pullAt');

// uuid generator
const uuid = require('uuid/v4');

// Networks
const Network = require('./network.js');
const FcnAdapter = require('./rps/fcnAdapter.js');
const SprayAdapter = require('./rps/sprayAdapter.js');

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
        type: [],
        options: { // options wiil be passed to all components of the overlay

        }
      }
    }, options);

    // construct the rps => this.rps = ....
    this._constructRps(this.options.rps.type, this.options.rps.options);

    // construct overlay
    this.overlays = [];
    // this._constructOverlays(this.options.overlays);

    debug('Networks (Rps and overlays) initialized.');
  }

  /**
   * Use a network, by default the last overlay added is your default network,
   * If you specify an index beginning by 0 representing the rps, you can use any network you added.
   * @param {number} index Index of the rps/overlay
   * @return {Network} Return a network to use.
   */
  use (index = 0) {
    if(this.overlays.length === 0 || index === 0) return this.rps;
    if(index === this.overlays.length) throw new RangeError('Index out of bound !');
    return this.overlays[index - 1];
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
   * Add an overlay to the our list of overlays, construct the overlay, and connect the overlay to the network by using the connection() Promise.
   * Return the overlay id after its construction, initialization
   * @param {Overlay|string} overlay Class Overlay, THIS IS NOT AN OBJECT ALREADY INITIALIZED ! THIS A REFERENCE TO THE CLASS Overlay, Or it can be a string representing the id of a default Implemented overlay
   * @return {Promise<string>} id Id of the new overlay
   */
  add (overlay) {
    if(typeof overlay !== 'object') throw new SyntaxError('An overlay is an object {class: ..., options: {...}}');
    this.log(overlay, typeof overlay);
    let obj = {
      id: uuid()
    };
    if(typeof overlay.class === 'function') {
      obj.overlay = new overlay({
        manager: this, // reference to the manager to access to other overlay when needed
        previous: this.overlays[0],
        options: overlay.options,
        origin: {
          overlay: overlay.class,
          options: overlay.options
        }
      });
    } else if( typeof overlay.class === 'string' ) {
      let overlord = this._defaultOverlay(overlay.class);
      if(!overlord) {
        return Promise.reject(new Error('No overlay available for this string id.'));
      }
      try {
        // initialization of the the overlay.
        obj.overlay = new overlord({
          manager: this, // reference to the manager to access to other overlay when needed
          previous: this.overlays[0],
          options: overlay.options,
          origin: {
            overlay: overlord,
            options: {}
          }
        });

        // Each default overlay has a specific id, fits this id to ids overlays/rps id in our list of overlay
        obj.id = obj.overlay.id;
      } catch (e) {
        return Promise.reject(e);
      }
    } else {
      return Promise.reject(new Error('overlay have to class reference or an available string id'));
    }
    // push this overlay to our list
    this.overlays.push(obj);
    return Promise.resolve(obj.id);
  }
}

module.exports = NetworkManager;
