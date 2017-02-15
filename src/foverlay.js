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

const  EventEmitter = require('events');
const GUID = require('./guid.js');
const _ = require('lodash');

/**
 * Implementation of an overlay based a T-man
 * You can change the implementation, of the two threads (ie, active and passive) but there is an implementation
 * Use : run() (by default) or run(activeCallback, passiveCallback)
 */
class FOverlay extends EventEmitter {
	constructor (options) {
		super();
		// create a unique id for the node
		this.genUid = new GUID();
		this.id = options.id || this.genUid.guid(); //

		// ========== PARAMETERS ==========
		// get the RPS
		this.source = options.source || console.log(new Error('Need a source as parameter : { source : ... , [, key:val]} '));
		// get unicast protocol, must provide a method send(message, peer)
		this.unicast = options.unicast || console.log(new Error('Need a unicast protocol as parameter in order to send messages : { unicast : ..., [, key:val] } unicast protocol will listen on the signal "receive"'));
		// ranking function, used to order view as we want, injected parameter : this.view
		this.rankingFunction = options.rankingFunction || function () {
			console.log('Please implement this method, the actual ranking function does nothing else than print this log');
		};

		// profile of the node
		this.profile = {};
		// set of (profile, id)
		this.view = {};
		// set of view
		this.buffer = {};

		this.bufferId = {};

		this.maxBound = options.maxBound || 10; // default 10 seconds
		this.factor = 1000; // milliseconds

	}

	sendTo (obj, id) {
		// save the buffer until we receive the response
		this.bufferId[id] = obj;
		this.unicast.send(obj, id);
	}

	run (activeCallback, passiveCallback) {
		this._active(activeCallback || this._defaultActiveCallback);
		this._passive(passiveCallback || this._defaultPassiveCallback);
	}

	selectView () {
		return this.rankingFunction(this.buffer).values.next().value();
	}

	/*
	* Apply the ranking function on view and return the first descriptor (ie, (id, profile))
	*/
	selectPeer () {
		return this.rankingFunction(this.view).values.next().value();
	}

	getDescriptor () {
		return { profile: this.profile, id : this.id };
	}

	/* **********************
	 * PRIVATE FUNCTIONS
	 * **********************/

	_passive (callback) {
		this.unicast.on('receive', (id, message) => {
			callback(this, id, message);
		});
	}

	_active (callback) {
		setInterval(function () {
			setTimeout(function () {
				// callback the callback with parameters
				callback(this);
			}, this._selectRandomTime);
		}, this.maxBound);
	}

	_selectRandomTime () {
		let rn = Math.floor(Math.random() * this.maxBound) + 1;
		rn = rn - 1;
		return rn * this.factor;
	}

	_merge (obj1, obj2) {
		return _.merge(obj1, obj2);
	}


	/*
	 * Default implementation of active and passive thread
	 */

	_defaultActiveCallback (overlay) {
		const p = overlay.selectPeer(); // it's the first value of the ranked view by the ranking function (a descriptor)
		const descriptor = overlay.getDescriptor(); // my descriptor
		overlay.buffer = overlay.merge(overlay.view, {descriptor});
		overlay.sendTo({
			type: 'onActive',
			buffer: overlay.buffer
		}, p.id);
	}

	_defaultPassiveCallback (overlay, id, message) {
		if (message && message.type && message.buffer) {
			if(message.type === 'onActive') {
				const descriptor = overlay.getDescriptor(); // my descriptor
				overlay.buffer = overlay.merge(overlay.view, {
					descriptor
				});
				overlay.sendTo({
					type: 'onActive',
					buffer: overlay.buffer
				}, id);
			}
			overlay.buffer = overlay.merge(message.buffer, overlay.view);
			overlay.view = overlay.selectView(overlay.buffer);
		}
	}
}

module.export = FOverlay;
