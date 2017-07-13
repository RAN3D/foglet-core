'use strict';

const EventEmitter = require ('events');
const lmerge = require('lodash/merge');

class AbstractOverlay extends EventEmitter {
  constructor (options) {
    super();
    if(!options.previous) {
      // NEED A BASE (a RPS or an another overlay)
      throw new Error('NEED A BASE (a RPS or an another overlay)')
    }
    this.manager = options.manager;
    this.previous = options.previous;
    this.options = lmerge({}, options.options);
  }

  connection (rps, timeout) {
    throw('Not Yet Implemented');
  }

  getNeighbours () {
    throw('Not Yet Implemented');
  }

  getPeers () {
    throw('Not Yet Implemented');
  }

  send (id, message) {
    throw('Not Yet Implemented');
  }

  onBroadcast (signal, callback) {
    throw('Not Yet Implemented');
  }


  sendBroadcast (msg) {
    throw('Not Yet Implemented');
  }

  onUnicast (callback) {
    throw('Not Yet Implemented');
  }


  sendUnicast (message, id) {
    throw('Not Yet Implemented');
  }

  exchange () {
    throw('Not Yet Implemented');
  }

}

module.exports = AbstractOverlay;
