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

// lodash utils functions
const lmerge = require('lodash/merge');
const llast = require('lodash/last');
const lfind = require('lodash/find');
const ldropRight = require('lodash/dropRight');
const lfindIndex = require('lodash/findIndex');
const lpullAt = require('lodash/pullAt');

const EventEmitter = require('events');
const uuid = require('uuid/v4');
const debug = require('debug')('foglet-core:om');

// Default Overlays
const LatenciesOverlay = require('./LatenciesOverlay.js');

/**
 * An overlay manager (OM) to manage networks Overlay
 * This OM is initialized with an RPS, other overlay are added in a stack.
 * You can use the {AbstractOverlay} API to use them because all overlay implemented here use this API.
 * We do not restrict the API, but you have to respect the first expected functions we listed in {AbstractOverlay}
 * If you want to add more parameters do it ! But please do it by respecting ad minima our API ;)
 */
class OverlayManager extends EventEmitter {
  /**
   * Construct the OverlayManager on top of a RPS
   */
  constructor (options) {
    super();

    this.defaultOptions = {
      limit: 10, // max 10 overlay available
      enable: true,
      overlays: [], // [{class: OverlayClass, options: overlayOptions}, ...]
      verbose: false
    };
    this.defaultOptions = lmerge(this.defaultOptions, options || {});

    this.overlays = [];
    if(!this.defaultOptions.rps) throw new SyntaxError('Need a RPS to initialized the OverlayManager');
    // add the rps to the list of overlays
    this.overlays.push({
      id: 'rps',
      overlay: this.defaultOptions.rps,
      manager: this
    });

    this.log('OverlayManager initialized.', this.overlays);
  }

  /**
   * Return the default object representing the Overlay correspondignt to its id.
   * @param  {string} id Id of the default overlay
   * @return {AbstractOverlay}
   */
  _defaultOverlay (id) {
    let result = undefined;
    switch(id) {
    case 'latencies': {
      result = LatenciesOverlay;
      break;
    }
    default: {
      result = new RangeError('No overlay corresponding to this id: '+id);
    }
    } // switch end
    return result;
  }

  /**
   * Add an overlay to the our list of overlays, construct the overlay, and connect the overlay to the network by using the connection() Promise.
   * Return the overlay id after its construction, initialization
   * @param {Overlay|string} overlay Class Overlay, THIS IS NOT AN OBJECT ALREADY INITIALIZED ! THIS A REFERENCE TO THE CLASS Overlay, Or it can be a string representing the id of a default Implemented overlay
   * @return {Promise<string>} id Id of the new overlay
   */
  add (overlay) {
    this.log(overlay, typeof overlay);
    let obj = {
      id: uuid()
    };
    if(typeof overlay === 'function') {
      obj.overlay = new overlay({
        manager: this, // reference to the manager to access to other overlay when needed
        previous: llast(this.overlays),
        options: overlay.options,
        origin: {
          overlay: overlay.class,
          options: overlay.options
        }
      });
    } else if( typeof overlay === 'string' ) {
      try {
        let overlord = this._defaultOverlay(overlay);
        obj.overlay = new overlord({
          manager: this, // reference to the manager to access to other overlay when needed
          previous: llast(this.overlays),
          options: overlay.options,
          origin: {
            overlay: overlord,
            options: {}
          }
        });
        // Each default overlay has a specific id, fits this id to ids overlays/rps id in our list of overlay
        obj.id = obj.overlay.id;
      } catch (e) {
        return Promise.reject(new Error('string id have to be an id of available overlay. See link{http://github.com/ra3nd/foglet-core} for documentation of available overlays.', e));
      }
    } else {
      Promise.reject(new Error('overlay have to class reference or an available string id'));
    }
    // push this overlay to our list
    this.overlays.push(obj);
    // Connect this overlay to the network.
    return new Promise((resolve, reject) => {
      this.get(obj.id).overlay.connection().then(() => {
        this.log('Overlay added.');
        resolve(obj.id);
      }).catch((e) => {
        reject(e);
      });
    });
  }

  /**
   * Use the adequat overlay, i.e: if enable, use the last overlay created, otherwise use the RPS
   * @return {AbstractOverlay|AbstractAdapter}
   */
  use () {
    if(this.defaultOptions.enable) {
      // return the last overlay
      return llast(this.overlays);
    }else {
      // return RPS
      return this.overlays[0];
    }
  }

  /**
   * Get a particular overlay (usefull when you want to use an overlay from another overlay)
   * @param  {string} id Get an overlay by its id, 'rps' is the id of the first network used, other id is the overlay id.
   * @return {AbstractOverlay|AbstractAdapter}
   */
  get (id) {
    return lfind(this.overlays, (obj) => obj.id === id);
  }

  /**
   * Get the list of overlays as an array beginning by the RPS
   * @return {array}
   */
  getList () {
    return this.overlays;
  }

  /**
   * Get the whole list of overlays by ids
   * @return {array} Array of string ids representing each Overlay enabled
   */
  getListByIds () {
    return this.overlays.map(p => p.id);
  }

  /**
   * Delete an overlay (experimental).
   * Due to intrinsic composition of overlays we have to reload the next overlay use by the deleted with the previous one.
   * Due to this it may cause "bugs" or non-expected behavior in the network. We use SPRAY-WRTC as main RPS because it is fault-tolerant and avoids churn.
   * But with other networks, behaviors are not well defined. Take care of your network !
   * @param  {string} id Id of the overlay to delete, you cannot delete the rps.
   * @return {Promise} Resolve when the deletion succeed and the overlay is properly connected in case of reloading. Otheriwe rejected.
   */
  delete (id) {
    return new Promise((resolve, reject) => {
      try {
        let index = lfindIndex(this.overlays, (obj) => obj.id === id);
        if(index !== 0 && index !== -1) {
          let last = llast(this.overlays);
          if(id === last) {
            ldropRight(this.overlays, 1);
            this.log('Overlay deleted.')
            resolve();
          } else {
            // need to reload the next overlay with the previous overlay
            let previous = this.overlays[index - 1];
            let next = this.overlays[index + 1];
            next.overlay = new next.origin.overlay({
              manager: this, // reference to the manager to access to other overlay when needed
              previous: previous,
              options: next.origin.options
            });
            next.overlay.connection().then(() => {
              // now we can safely remove the element from the array
              lpullAt(this.overlays, [ index ]);
              this.log('Overlay deleted and reloaded.').
              resolve();
            }).catch(e => {
              this.log('Reload of the next overlay went wrong... Try to search around the connection function of your Overlay.')
              reject(e);
            });
          }
        } else {
          reject(new SyntaxError('Undefined or can\'t delete the RPS.'));
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  log (...args) {
    if(this.defaultOptions.verbose) debug(...args);
  }

}

module.exports = OverlayManager;
