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

const lmerge = require('lodash/merge');
const Fcn = require('fcn-wrtc').Fcn;
const AbstractAdapter = require('./../abstract/abstract-adapter.js');

class fcnAdapter extends AbstractAdapter {
  constructor (options) {
    super();
    this.options = lmerge({
      webrtc: {
        trickle: true,
        iceServers: []
      }
    }, options);
    // if webrtc options specified: create object config for Spray
    this.options = lmerge({config: this.options.webrtc}, this.options);
    this.rps = new Fcn(this.options);
  }

  get inviewId () {
    return this.rps.getInviewId();
  }

  get outviewId () {
    return this.rps.getOutviewId();
  }

  getNeighbours (k = undefined) {
    return this.rps.getPeers(k).o;
  }

}

module.exports = fcnAdapter;
