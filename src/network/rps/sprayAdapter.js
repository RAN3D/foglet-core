/*
MIT License

Copyright (c) 2016 Grall Arnaud

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the 'Software'), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
'use strict';

const AbstractAdapter = require('./../abstract/abstract-adapter.js');
// const lremove = require('lodash/remove');
const Spray = require('spray-wrtc');
const lmerge = require('lodash/merge');

class SprayAdapter extends AbstractAdapter {
  constructor (options) {
    super();
    this.options = lmerge({
      webrtc:	{ // add WebRTC options
        trickle: true, // enable trickle (divide offers in multiple small offers sent by pieces)
        iceServers : [] // define iceServers in non local instance
      },
      origins:'*',
    }, options);
    // if webrtc options specified: create object config for Spray
    this.options = lmerge({config: this.options.webrtc}, this.options);

    // need to expose a rps
    this.rps = new Spray(this.options);

    // need to expose an inview/outview ids
    this.inviewId = this.rps.getInviewId();
    this.outviewId = this.rps.getOutviewId();
    // make a unique id of this network
    this.id = this.inviewId+'_'+this.outviewId;
  }

  /**
   * Get the list of neighbours
   * @return {array}
   */
  getNeighbours (k = undefined) {
    // BUG, sometimes our id is in our partial view.
    // Tempory fix by removing this element if in results
    let result = this.rps.getPeers(k);
    // lremove(result, (elem) => {
    //   return elem === this.inviewId;
    // })
    return result;
  }
}

module.exports = SprayAdapter;
