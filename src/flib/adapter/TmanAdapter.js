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

// networks
const TMan = require('tman-wrtc');

// abstract adpater
const AbstractAdapter = require('../AbstractAdapter.js');

// lodash utils
const lmerge = require('lodash/merge');

/**
 * This TMan Adapter is built on top of application built with @link{https://github.com/RAN3D/neighborhood-wrtc} and @link{https://github.com/RAN3D/n2n-overlay-wrtc}
 * It means, if you want to use this adapter with your own network, we assume that you are using the same API than ours.
 * This TMan network can be used with fcn-wrtc or spray-wrtc
 * Here, with tman-wrtc and due to neighborhood-wrtc, WebRTC connections are shared.
 * It means if you want to create a second "route" to the same peer, the connection won't be established but will work ;)
 */
class TManAdapter extends AbstractAdapter {
  constructor (options) {
    super(options);

    this.options = lmerge({
      parent: undefined,
      descriptor: undefined,
      ranking: undefined,
    }, options);

    // need at least a descriptor and a ranking function
    if(!this.options.descriptor || !this.options.ranking || typeof this.options.descriptor !== 'object' || typeof this.options.ranking !== 'function' )
      throw new SyntaxError('Need at least a descriptor (object) and a ranking function (function).');

    // When a parent is provided this means that we can pick neihbours in the rps to accelerate the process of the TMan
    if(this.options.parent) {

    } else {
      // build the network based on the descriptor and the ranking without RPS
    }
  }


}

module.exports = TManAdapter;
