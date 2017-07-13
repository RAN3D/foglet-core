'use strict';

const EventEmitter = require ('events');

class AbstractAdapter extends EventEmitter {
  constructor () {
    super();
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

module.exports = AbstractAdapter;
