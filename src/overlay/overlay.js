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

const TManSpray = require('./tman.js').TManSpray;
const _ = require('lodash');
const EventEmitter = require('events');

class Overlay extends EventEmitter {
	constructor (rps, options) {
		super();

		if(!rps) {
			throw new Error('Need a rps...');
		}

		this.defaultOptions = {
			overlayOptions: {
				rpsObject: rps
			}
		};
		this.defaultOptions = _.merge(this.defaultOptions, options || {});
		this.defaultOptions.rps = rps;

		this.overlay = this.defaultOptions.overlay || new TManSpray(this.defaultOptions);

		this.overlay.on('receive', (signal, data) => {
			this.emit('receive', signal, data);
		});
	}

	init (limit = 0) {
		this.overlay.init(limit);
	}

	getNeighbours () {
		return this.overlay.socket.getNeighbours();
	}

	send (id, message) {
		return this.overlay.send(id, message);
	}

	getViews () {
		return this.overlay.views;
	}

	getUniqViews () {
		return _.uniqBy(this.getViews(), 'id');
	}



	getCycles () {
		return this.overlay.cycles;
	}
}

module.exports = Overlay;
