'use strict';

// Communication
const Communication = require('./communication/communication.js');
// Signaling
const Signaling = require('./signaling/signaling.js');

/**
 * A network is composed of a RPS/Overlay, a signaling part and a communication part
 */
class Network {
  constructor (network, options) {
    this.network = network;
    this.signaling = new Signaling(network, options.signaling);
    this.communication = new Communication(network, options.protocol);
  }
}

module.exports = Network;
