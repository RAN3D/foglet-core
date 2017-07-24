'use strict';

// Communication
const Communication = require('./communication/communication.js');
// Signaling
const Signaling = require('./signaling/signaling.js');
// debug
const debug = require('debug')('foglet-core:network');

/**
 * A network is composed of a RPS/Overlay, a signaling part and a communication part
 */
class Network {
  constructor (network, options) {
    this.network = network;
    this.signaling = new Signaling(network.rps, options.signaling);
    this.communication = new Communication(network.rps, options.protocol);
    debug('Network initialized for protocol: '+options.protocol);
  }
}

module.exports = Network;
