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
const Broadcast = require('causal-broadcast-definition');
const uuid = require('uuid/v4');
const VVwE = require('version-vector-with-exceptions');

class FBroadcast extends EventEmitter {
	constructor (options) {
		super();
		if(options.foglet && options.protocol) {
			this.uid = uuid();
			this.protocol = 'fbroadcast-'+options.protocol;
			this.vector = new VVwE(this.uid);
			this.broadcast = new Broadcast(options.foglet.options.spray, this.vector, this.protocol);

			this.sniffer = options.sniffer || function (message) {
				return message;
			};

			this.broadcast.on('receive', (message) => this._onReceive(message));
		}else{
			return new Error('Not enough parameters', 'fbroadcast.js');
		}
	}

	send (message, after = null) {
		const v = this.vector.increment();
		this.broadcast.send(message, v, after);
		return v;
	}

	_onReceive (message) {
		this.emit('receive', message);
	}
}

module.exports = FBroadcast;
