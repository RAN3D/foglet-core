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

const lmerge = require('lodash/merge');
const llast = require('lodash/last');
const lfind = require('lodash/find');
const ldropRight = require('lodash/dropRight');
const lfindIndex = require('lodash/findIndex');

const EventEmitter = require('events');
const uuid = require('uuid/v4');
const debug = require('debug')('foglet-core:om');

/**
 * An overlay manager, methods fit methods of AbstractAdapter, each overlay added to the manager have to be conformed to this API {link ./AbstractOverlay.js}
 */
class OverlayManager extends EventEmitter {
  /**
   *
   */
  constructor (options) {
    super();

    this.defaultOptions = {
      limit: 10, // max 10 overlay available
      enable: true,
      verbose: false
    };
    this.defaultOptions = lmerge(this.defaultOptions, options || {});

    this.overlays = [];
    if(!this.defaultOptions.rps) throw new Error('Need a RPS to initialized the OverlayManager');
    // add the rps to the list of overlays
    this.overlays.push({
      id: 'rps',
      overlay: this.defaultOptions.rps,
      manager: this
    });

  }

  /**
   * Add an overlay to the our list of overlays, construct the overlay.
   * Return the overlay id after its construction
   * @param {Overlay} overlay Class Overlay, THIS IS NOT AN OBJECT ALREADY INITIALIZED ! THIS A REFERENCE TO THE CLASS Overlay
   * @return {string} id Id of the new overlay
   */
  add (overlay, options) {
    // priority cannot be 0, reserved for RPS
    let obj = {
      id: uuid(),
      origin: {
        overlay,
        options
      },
      overlay: new overlay({
        manager: this, // reference to the manager to access to other overlay when needed
        previous: llast(this.overlays),
        options
      })
    };
    this.overlays.push(obj);
    return obj.id;
  }

  /**
   * Use the adequat overlay, i.e: if enable, use the last overlay created, otherwise use the RPS
   * @return {Overlay}
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
   * @param  {[type]} id [description]
   * @return {[type]}    [description]
   */
  get (id) {
    return lfind(this.overlays, (obj) => obj.id === id);
  }

  delete (id) {
    let index = lfindIndex(this.overlays, (obj) => obj.id === id);
    if(index !== 0 && index !== -1) {
      let last = llast(this.overlays);
      if(id === last) {
        ldropRight(this.overlays, 1);
      } else {
        // need to reload the next overlay with the previous overlay
        let previous = this.overlays[index - 1];
        let next = this.overlays[index + 1];
        next.overlay = new next.origin.overlay({
          manager: this, // reference to the manager to access to other overlay when needed
          previous: previous,
          options: next.origin.options
        });
      }

    } else {
      this.log('Undefined or can\'t delete the RPS.');
    }
  }

  log (...args) {
    if(this.defaultOptions.verbose) debug(...args);
  }

}

module.exports = OverlayManager;
