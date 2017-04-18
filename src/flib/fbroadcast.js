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
const VVwE = require('version-vector-with-exceptions');
const _ = require('lodash');
const Unicast = require('unicast-definition');
const debug = require('debug')('foglet-core:broadcast');

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

class FBroadcast extends EventEmitter {
	constructor (options) {
		super();
		if(options.rps && options.protocol) {
			this.options = _.merge({
				delta: 1000 * 60 * 1 / 2,
				timeBeforeStart: 2 * 1000
			}, options);
			this.uid = uuid();
			this.protocol = 'fbroadcast-'+this.options.protocol;
			this.causality = new VVwE(this.uid);

			this.source = this.options.rps;
			// The sniffer is working before message is sent and after result is received
			this.sniffer = this.options.sniffer || function (message) {
				return message;
			};
			this.unicast = new Unicast(this.source.rps, {});
			this.peer = this.unicast.register(this.protocol);

			// buffer of operations
			this.buffer = [];
			// buffer of anti-entropy messages (chunkified because of large size)
			this.bufferAntiEntropy = new MAntiEntropyResponse('init');

			this.peer.on(this.protocol, (id, message) => {
				this._receiveMessage(id, message);
			});


			setTimeout(() => {
				// let 2 seconds for the socket to open properly
				debug('Send First AntiEntropyRequest.');
				this._sendAll(new MAntiEntropyRequest(this.causality));
			}, this.options.timeBeforeStart);

			setInterval(() =>{
				debug('Send AntiEntropyRequest.');
				this._sendAll(new MAntiEntropyRequest(this.causality));
			}, this.options.delta);
		}else{
			return new Error('Not enough parameters', 'fbroadcast.js');
		}
	}

	_sendAll (message) {
		const n = this.source.getNeighbours();
		if(n.length > 0) n.forEach(p => this.peer.emit(this.protocol, p, this.source.outviewId, message).catch(e => debug('Error: It seems there is not a receiver', e)));
	}


	send (message, id = {_e:0, _c:0}, isReady) {
		const sniffed = this.sniffer(message);
		if(sniffed) {
			message = sniffed;
		}
		let mBroadcast = new MBroadcast(this.protocol, this.causality.increment(), isReady, message);
		// #2 register the message in the structure
		this.causality.incrementFrom(id);

		// #3 send the message to the neighborhood
		debug(`@${this.source.inviewId}: Send a broadcast message.`);
		this._sendAll(mBroadcast);
		return mBroadcast.id;
	}

	_onReceive (message) {
		debug(`@${this.source.inviewId}: Deliver the message.`);
		const sniffed = this.sniffer(message);
		if(sniffed) {
			message = sniffed;
		}
		this.emit('receive', message);
	}

	sendAntiEntropyResponse (origin, causalityAtReceipt, messages) {
		debug(`@${this.source.inviewId}: sendAntiEntropyResponse..`);
		let id = uuid();
		// #1 metadata of the antientropy response
		let sent = this.peer.emit(this.protocol, origin, this.source.getOutviewId(), new MAntiEntropyResponse(id, causalityAtReceipt, messages.length));
		let i = 0;
		while (sent && i < messages.length) {
			sent = this.peer.emit(this.protocol, origin, this.source.getOutviewId(), new MAntiEntropyResponse(id, null, messages.length, messages[i]));
			++i;
		}
	}

	_receiveMessage (id, message) {
		debug(`@${this.source.inviewId}: ReceiveMessage`, id, message);
		switch (message.type) {
		case 'MAntiEntropyRequest':
			this.emit('antiEntropy', id, message.causality, this.causality.clone());
			break;
		case 'MAntiEntropyResponse':
			// #A replace the buffered message
			if (this.bufferAntiEntropy.id !== message.id) {
				this.bufferAntiEntropy = message;
			}
			// #B add the new element to the buffer
			if (message.element) {
				this.bufferAntiEntropy.elements.push(message.element);
			}
			// #C add causality metadata
			if (message.causality) {
				this.bufferAntiEntropy.causality = message.causality;
			}
			// #D the buffered message is fully arrived, deliver
			if (this.bufferAntiEntropy.elements.length === this.bufferAntiEntropy.nbElements) {
				// #1 considere each message in the response independantly
				for (let i = 0; i<this.bufferAntiEntropy.elements.length; ++i) {
					let element = this.bufferAntiEntropy.elements[i];
					// #2 only check if the message has not been received yet
					if (!this._stopPropagation(element)) {
						this.causality.incrementFrom(element.id);
						this.emit('receive', element.payload);
					}
				}
				// #3 merge causality structures
				this.causality.merge(this.bufferAntiEntropy.causality);
			}
			break;
		default:
			debug(`@${this.source.inviewId}: ReceiveBroadcast:1.`, message, this.causality, message.id);
			if (!this._stopPropagation(message)) {
				debug(`@${this.source.inviewId}: ReceiveBroadcast:2.`, message);
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

	_stopPropagation (message) {
		const a = this.causality.isLower(message.id);
		const b = this._bufferIndexOf( message.id )>=0;
		debug(`@${this.source.inviewId}: Stoppropagation.`, a, b);
		return  a||b;
	}

	_bufferIndexOf (id) {
		debug(`@${this.source.inviewId}: BufferIndexOf.`);
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
		debug(`@${this.source.inviewId}: ReviewBuffer`);
		let found = false, i = this.buffer.length - 1;
		while(i>=0) {
			let message = this.buffer[i];
			if (this.causality.isLower(message.id)) {
				this.buffer.splice(i, 1);
			} else {
				if (this.causality.isReady(message.isReady)) {
					found = true;
					this.causality.incrementFrom(message.id);
					this.buffer.splice(i, 1);
					this.emit('receive', message.payload);
				}
			}
			--i;
		}
		if (found) {
			this._reviewBuffer();
		}
	}
}

module.exports = FBroadcast;
