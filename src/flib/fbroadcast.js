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

const EventEmitter = require('events');
const uuid = require('uuid/v4');
const lmerge = require('lodash/merge');
const Unicast = require('unicast-definition');
const debug = require('debug')('foglet-core:broadcast');
const VV = require('./vv.js'); // Version-Vector

function MBroadcast (name, id, isReady, payload) {
  this.protocol = name;
  this.id = id;
  this.isReady = isReady;
  this.payload = payload;
}

function MAntiEntropyRequest (causality) {
  this.type = 'MAntiEntropyRequest';
  this.causality = causality;
}


function MAntiEntropyResponse (id, causality, nbElements, element) {
  this.type = 'MAntiEntropyResponse';
  this.id = id;
  this.causality = causality;
  this.nbElements = nbElements;
  this.element = element;
  this.elements = [];
}

function clone (obj) {
  return lmerge({}, obj);
}

class FBroadcast extends EventEmitter {
  constructor (options) {
    super();
    if(options.rps && options.protocol) {
      this.options = lmerge({
        delta: 1000 * 60 * 1 / 2,
        timeBeforeStart: 2 * 1000
      }, options);
      this.uid = uuid();
      this.protocol = 'fbroadcast-'+this.options.protocol;
      this.causality = new VV(this.uid);
      this.causality.incrementFrom({_e:this.uid, _c: 0});
      this.source = this.options.rps;
      // The sniffer is working before message is sent and after result is received
      this.sniffer = this.options.sniffer || function (message) {
        return message;
      };
      this.unicast = new Unicast(this.source.rps, {pid: this.protocol});

      // buffer of operations
      this.buffer = [];
      // buffer of anti-entropy messages (chunkified because of large size)
      this.bufferAntiEntropy = new MAntiEntropyResponse('init');

      this.unicast.on(this.protocol, (id, message) => {
        this._receiveMessage(id, message);
      });

      debug(`initialized for:  ${this.options.protocol}`);
    }else{
      return new Error('Not enough parameters', 'fbroadcast.js');
    }
  }

  _sendAll (message) {
    const n = this.source.getNeighbours(Infinity);
    if(n.length > 0) n.forEach(p => this.unicast.emit(this.protocol, p, this.source.outviewId, message).catch(e => debug('Error: It seems there is not a receiver', e)));
  }


  send (message, isReady = undefined) {
    const sniffed = this.sniffer(message);
    if(sniffed) {
      message = sniffed;
    }
    const a = this.causality.increment();
    let mBroadcast = new MBroadcast(this.protocol, a, isReady || this.causality.clone(), message);
    // #2 register the message in the structure
    this.causality.incrementFrom(a);

    // #3 send the message to the neighborhood
    this._sendAll(mBroadcast);
    return mBroadcast.isReady;
  }

  _onReceive (message) {
    const sniffed = this.sniffer(message);
    if(sniffed) {
      message = sniffed;
    }
    this.emit('receive', message);
  }

  sendAntiEntropyResponse (origin, causalityAtReceipt, messages) {
    let id = uuid();
    // #1 metadata of the antientropy response
    let sent = this.unicast.emit(this.protocol, origin, this.source.outviewId, new MAntiEntropyResponse(id, causalityAtReceipt, messages.length));
    let i = 0;
    while (sent && i < messages.length) {
      sent = this.unicast.emit(this.protocol, origin, this.source.outviewId, new MAntiEntropyResponse(id, null, messages.length, messages[i]));
      ++i;
    }
  }

  _receiveMessage (id, message) {
    switch (message.type) {
      default: {
        if (!this._stopPropagation(message)) {
          // #1 register the operation
          this.buffer.push(message);
          // #2 deliver
          this._reviewBuffer();
          // #3 rebroadcast
          this._sendAll(message);
        }
        break;
      }

    }
  }

  _stopPropagation (message) {
    const a = this.causality.isLower(message.id);
    const b = this._bufferIndexOf( message.id )>=0;
    return  a||b;
  }

  _bufferIndexOf (id) {
    let found = false,
      index = -1,
      i = 0;
    while (!found && i<this.buffer.length) {
      // (TODO) fix uglyness
      if (JSON.stringify(this.buffer[i].id) === JSON.stringify(id)) {
        found = true; index = i;
      }
      ++i;
    }
    return index;
  }

  _reviewBuffer () {
    let found = false, i = this.buffer.length - 1;
    while(i>=0) {
      let message = this.buffer[i];
      if (this.causality.isLower(message.id)) {
        this.buffer.splice(i, 1);
      } else {
        found = true;
        this.causality.incrementFrom(message.id);
        this.buffer.splice(i, 1);
        this.emit('receive', message.payload);
      }
      --i;
    }
    if (found) {
      this._reviewBuffer();
    }
  }

}

module.exports = FBroadcast;
