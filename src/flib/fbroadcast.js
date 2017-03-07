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
const Unicast = require('unicast-definition');
const uuid = require('uuid/v4');
const LRU = require('lru-cache');
const VVwE = require('version-vector-with-exceptions');

class FBroadcastMessage {
	constructor (options) {
		this.value = options.value || null;
		this.id = options.id || null;
		this.ec = options.ec || { _e: 0, _c: 0};
		this.isReady = options.isReady || null;
	}
}


class FBroadcast extends EventEmitter {
	constructor (options) {
		super();
		if(options.foglet && options.protocol && options.size) {
			this.uid = uuid();
			this.protocol = 'fbroadcast-'+options.protocol;
			this.alsoMe = options.me || false;
			this.foglet = options.foglet;
			this.size = options.size || 100;

			this.sniffer = options.sniffer || function (message) {
				return message;
			};

			const lruOptions = {
				max: this.size
			};

			this.cache = new LRU(lruOptions);
			this.causality = new VVwE(uuid(), lruOptions);

			this.unicast = new Unicast(this.foglet.options.spray, this.protocol + '-unicast');

			const self = this;
			this.unicast.on('receive', (id, message) => {
				if(!self._stopPropagation(message)) {
					message = self.sniffer(message);

					self.cache.set(message, message);

					self._reviewCache(); // Emit all messages ready to emit and delete them from the cache

					self._resend(message);
				}
			});
		}else{
			return new Error('Not enough parameters', 'fbroadcast.js');
		}
	}

	send (message, isReady = null, delay = 0) {
		// console.log('delay:'+delay);
		if(this.alsoMe) {
			this.emit('receive', message);
		}
		const id = uuid();
		const messageToSend = new FBroadcastMessage({
			value : message,
			id,
			ec: this.causality.increment(),
			isReady
		});
		this.causality.incrementFrom(messageToSend.ec);

		const self = this;
		setTimeout(function () {
			self._resend(messageToSend);
		}, delay);

		// Causal Id of the message
		return messageToSend.ec;
	}

	_resend (message) {
		this.foglet._flog('resend:');
		// console.log(message);
		const neighbours = this.foglet.getNeighbours();
		const self = this;
		neighbours.forEach((peer) => {
			self.unicast.send(message, peer);
		});
	}

	_reviewCache () {
		let ready = false;
		const self = this;
		this.cache.rforEach( (value, key) => {
			// console.log(value);
			if(self.causality.isLower(value.ec)) {
				self.foglet._flog('we delete');
				self.cache.del(key);
			}else{
				// console.log('ec:' + JSON.stringify(value.ec));
				// console.log('isready:' + JSON.stringify(value.isReady));
				if(self.causality.isReady(value.isReady)) {
					self.foglet._flog('found && emit');
					ready = true;
					self.causality.incrementFrom(value.ec);
					self.emit('receive', value.value);
					self.cache.del(key);
				}
			}
		});
		// If we have found one element we
		if(ready) {
			this._reviewCache();
		}
	}

	_stopPropagation (message) {
		return message.ec && ( this.causality.isLower(message.ec) || this.cache.get(message.ec) !== undefined);
	}

}

module.exports = { FBroadcast };
