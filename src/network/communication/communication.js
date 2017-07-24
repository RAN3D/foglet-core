'use strict';

const debug = require('debug')('foglet-core:communication');
const Unicast = require('./unicast/unicast.js');
const Broadcast = require('./broadcast/broadcast.js');

class Communication {
  constructor (source, protocol) {
    debug(source, protocol);
    this.unicast = new Unicast(source, protocol);
    this.broadcast = new Broadcast(source, protocol);
    debug('Communication enabled for protocol; ' + protocol);
  }

  /**
   * Send a message to a specified peer
   * @param  {string} id      Id of the message to send
   * @param  {Object} message Message to send
   * @return {Promise} Promise resolved when the message is sent
   */
  sendUnicast (id, message) {
    return this.unicast.send(id, message);
  }

  /**
   * Send a message to multiple peers
   * @param  {array<string>} ids     Array of ids to the send message
   * @param  {Object} message Message to send
   * @return {Promise}         Promise resolve when all message are sent
   */
  sendMultipleUnicast (ids, message) {
    return this.unicast.sendMultiple(ids, message);
  }

  /**
  * Send a broacasted message
  * @param  {[type]} message Message to broadcast over the network
  * @return {Object}  id of the message sent
  */
  sendBroadcast (message) {
    return this.broadcast.send(message);
  }

  /**
  * This callback is a parameter of the onUnicast function.
  * @callback callback
  * @param {string} id - sender id
  * @param {object} message - the message received
  */
  /**
  * Listen on incoming unicasted message
  * @param  {Function} callback [description]
  * @return {[type]}            [description]
  */
  onUnicast (callback) {
    this.unicast.on('receive', (id, message) => {
      callback(id, message);
    });
  }

  /**
  * This callback is a parameter of the onUnicast function.
  * @callback callback
  * @param {string} id - sender id
  * @param {object} message - the message received
  */
  /**
  * Listen once incoming unicasted message
  * @param  {Function} callback [description]
  * @return {[type]}            [description]
  */
  onOnceUnicast (callback) {
    this.unicast.once('receive', (id, message) => {
      callback(id, message);
    });
  }

  /**
  * This callback is a parameter of the onBroadcast function.
  * @callback callback
  * @param {string} id - sender id
  * @param {object} message - the message received
  */
  /**
   * Listen on broadcasted messages
   * @param  {Function} callback
   * @return {void}
   */
  onBroadcast (callback) {
    this.broadcast.on('receive', (id, message) => callback(id, message));
  }

  /**
  * This callback is a parameter of the onBroadcast function.
  * @callback callback
  * @param {string} id - sender id
  * @param {object} message - the message received
  */
  /**
   * Listen once broadcasted messages
   * @param  {Function} callback
   * @return {void}
   */
  onOnceBroadcast (callback) {
    this.broadcast.once('receive', (id, message) => callback(id, message));
  }

  /**
   * Remove all 'receive' unicast callback
   * @return {void}
   */
  removeAllUnicastCallback () {
    this.unicast.removeAllListeners('receive');
  }

  /**
   * Remove all 'receive' broadcast callback
   * @return {[type]} [description]
   */
  removeAllBroacastCallback () {
    this.broadcast.removeAllListeners('receive');
  }
}

module.exports = Communication;
