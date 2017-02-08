/*
MIT License

Copyright (c) 2016 Grall Arnaud

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
'use strict';

const EventEmitter = require('events');
const Unicast = require('unicast-definition');
const GUID = require('./guid.js');
const LRU = require('lru_map').LRUMap;

class FBroadcastMessage {
	constructor (options) {
		this.value = options.value || null;
		this.id = options.id || null;
	}
}


class FBroadcast extends EventEmitter {
	constructor (options) {
		super();
		if(options.foglet && options.protocol && options.size) {
			this.uid = new GUID();
			this.protocol = 'fbroadcast-'+options.protocol;
			this.alsoMe = options.me || false;
			this.foglet = options.foglet;
			this.size = options.size || 100;
			this.cache = new LRU(this.size);

			this.unicast = new Unicast(this.foglet.spray, this.protocol + '-unicast');

			const self = this;
			this.unicast.on('receive', (id, message) => {

				if(!self._stopPropagation(message)) {
					self.emit('receive', message.value);
					self._resend(message);
				}
			});
		}else{
			return new Error('Not enough parameters', 'fbroadcast.js');
		}
	}

	send (message) {
		if(this.alsoMe) {
			this.emit('receive', message);
		}
		// Message is an object
		const id = this.uid.guid();
		const messageToSend = new FBroadcastMessage({
			value : message,
			id
		});
		this._resend(messageToSend);
	}

	_resend (message) {
		this.cache.set(message.id, message.id);
		const neighbours = this.foglet.getNeighbours();
		const self = this;
		neighbours.forEach((peer) => {
			self.unicast.send(message, peer);
		});
	}

	_stopPropagation (message) {
		if(message.id && this.cache.get(message.id) !== undefined) {
			return true;
		}else{
			return false;
		}
	}
}

module.exports = { FBroadcast };
