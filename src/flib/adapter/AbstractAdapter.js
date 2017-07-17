'use strict';

const EventEmitter = require ('events');

class AbstractAdapter extends EventEmitter {
  constructor () {
    super();
  }

  /**
   * Connect a RPS to another RPS by using a signaling server or any other methods you have
   * @param  {AbstractAdapter} rps Do you want to connect to a direct {AbstractAdapter} object ? Do it by adding the object here.
   * @param  {number} timeout Specify the timeout of the connection
   * @return {Promise}  Return a promise, resolve when the connection is successsfully achieved, rejected by tiemout or errors during the connection
   */
  connection (rps, timeout) {
    throw('Not Yet Implemented');
  }

  /**
   * Get the list of neighbours
   * @return {array}
   */
  getNeighbours () {
    throw('Not Yet Implemented');
  }

  /**
  * Allow to listen on Foglet when a broadcasted message arrived
  * @function onBroadcast
  * @param {callback} callback - Callback function that handles the response
  * @returns {void}
  **/
  onBroadcast (callback) {
    throw('Not Yet Implemented');
  }

  /**
  * Send a broadcast message to all connected clients.
  * @function sendBroadcast
  * @param {object} msg - Message to send,
  * @param {string} id - Id of the message to wait before to receive the message sent (see VVwE: github.com/chat-wane/version-vector-with-exceptions).
  * @returns {void}
  */
  sendBroadcast (msg) {
    throw('Not Yet Implemented');
  }

  /**
  * This callback is a parameter of the onUnicast function.
  * @callback callback
  * @param {string} id - sender id
  * @param {object} message - the message received
  */
  /**
  * onUnicast function allow you to listen on the Unicast Definition protocol, Use only when you want to receive a message from a neighbour
  * @function onUnicast
  * @param {callback} callback The callback for the listener
  * @return {void}
  */
  onUnicast (callback) {
    throw('Not Yet Implemented');
  }

  /**
  * Send a message to a specific neighbour (id)
  * @function sendUnicast
  * @param {object} message - The message to send
  * @param {string} id - One of your neighbour's id
  * @return {boolean} return true if it seems to have sent the message, false otherwise.
  */
  sendUnicast (message, id) {
    throw('Not Yet Implemented');
  }

  /**
   * Init a shuffle of the network, i.e: renewing the neighborhood.
   * @return {void}
   */
  exchange () {
    throw('Not Yet Implemented');
  }

}

module.exports = AbstractAdapter;
