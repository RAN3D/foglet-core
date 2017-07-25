'use strict';

const AbstractUnicast = require('./../abstract/abstract-unicast.js');
const UnicastDefinition = require('unicast-definition');
const debug = require('debug')('foglet-core:unicast');

class Unicast extends AbstractUnicast {
  constructor (source, protocol) {
    super(source, protocol);
    this.unicast = new UnicastDefinition(this.source.rps, {pid: this.protocol});
    this.unicast.on(this.protocol, (id, message) => {
      this._receive(id, message);
    });
  }

  /**
   * Send a message to a specified peer by its id
   * @param  {string} id      Id of the peer
   * @param  {Object} message Message to send to the peer
   * @return {Promise}         Resolve when the message has been sent
   */
  send (id, message) {
    if (id && message) {
      return this.unicast.emit(this.protocol, id, this.source.outviewId, message);
    } else {
      return Promise.reject('Missing id or message');
    }
  }

  /**
   * Send a message to specified peers id
   * @param  {array<string>} ids      List of peer ids
   * @param  {Object} message Message to send to all peers
   * @return {Promise}         Resolved when all message sent, otherwise rejected.
   */
  sendMultiple (ids = [], message) {
    return new Promise((resolve, reject) => {
      if (ids.length > 0) {
        ids.reduce((acc, current, index) => {
          return this.send(ids[index], message);
        }, Promise.resolve()).then(() => resolve()).catch(e => reject(e));
      } else {
        debug('No ids specified, message not sent');
        reject();
      }
    });
  }

  _receive (id, message) {
    this.emit('receive', id, message);
  }
}

module.exports = Unicast;
