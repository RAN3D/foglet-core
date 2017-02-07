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
const VVwE = require('version-vector-with-exceptions');
const CausalBroadcast = require('causal-broadcast-definition');
const Unicast = require('unicast-definition');
const Q = require('q');

class FInterpreter extends EventEmitter {
	/**
	 * @constructor
	 * @param {Foglet} foglet This is the parent object in order to get all foglet basics operations
	 */
	constructor (foglet) {
		super();
		this.foglet = foglet;
		this.protocol = 'interpreter';
		this.vector = new VVwE(Number.MAX_VALUE);
		this.broadcast = new CausalBroadcast(this.foglet.spray, this.vector, this.protocol + '-broadcast');
		this.unicast = new Unicast(this.foglet.spray, this.protocol + '-unicast');
		this.signalBroadcast = this.protocol + '-broadcast';
		this.signalUnicast = this.protocol + '-unicast';

		const self = this;
		this.broadcast.on('receive', message => {
			self.receiveBroadcast (message);
		});

		this.unicast.on('receive', message => {
			self.receiveUnicast (message);
		});

	}

	receiveBroadcast (message) {
		this.emit(this.signalBroadcast, message);
	}

	receiveUnicast (id, message) {
		this.emit(this.signalUnicast, message);
	}

	sendBroadcast (message) {
		this.broadcast.send(message, this.vector.increment());
	}

	sendUnicast (message, peerId) {
		this.unicast.send(message, peerId);
	}

	_flog (message) {
		this.foglet._flog('[Interpreter]' + message);
	}

}

module.exports = { FInterpreter };
