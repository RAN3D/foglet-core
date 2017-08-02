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
   * @param  {AbstractNetwork} network - The network layer
   * @param  {Object} signaling - Options used to build the signaling part
   * @param  {string} signaling.address - URL of the signaling server
   * @param  {string} signaling.room - Name of the room in which the application run
   * @param  {string} protocol - Name of the protocol run by the network
   */
  constructor (network, signaling, protocol) {
    this._network = network;
    this._signaling = new Signaling(network, signaling);
    this._communication = new Communication(network, protocol);
  }

  /**
   * The network component
   * @return {AbstractNetwork} The network component
   */
  get network () {
    return this._network;
  }

  /**
   * The signaling component
   * @return {Signaling} The signaling component
   */
  get signaling () {
    return this._signaling;
  }

  /**
   * The communication component
   * @return {Communication} The communication component
   */
  get communication () {
    return this._communication;
  }
}

module.exports = Network;
