'use strict';

// Communication
const Communication = require('./communication/communication.js');
// Signaling
const Signaling = require('./signaling/signaling.js');

/**
 * Network represent a network layer with three main components:
 * * The **network** itself, which can be a RPS, like {@link SprayAdapter}, or an overlay, like {@link LatenciesOverlay}.
 * * The **signaling** part, which is a connection with a signaling server used by peers to join the network.
 * * The **communication** part, which allow a peer to send message in the network using broadcast or unicast channels.
 * @author Grall Arnaud (folkvir)
 */
class Network {
  /**
   * Constructor
   * @param  {AbstractAdapter|AbstractOverlay} network - The network layer
   * @param  {Object} signaling - Options used to build the signaling part
   * @param  {string} signaling.address - URL of the signaling server
   * @param  {string} signaling.room - Name of the room in which the application run
   * @param  {string} protocol - Name of the protocol run by the network
   */
  constructor (network, signaling, protocol) {
    this.network = network;
    this.signaling = new Signaling(network, signaling);
    this.communication = new Communication(network, protocol);
  }
}

module.exports = Network;
