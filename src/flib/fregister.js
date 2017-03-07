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

/**
 * Create a FRegister Class, this an eventually consitent data structure, using a CausalBroadcast and a version-vector-with-exceptions from Chat-Wane (github)
 * @class FRegister
 * @author Grall Arnaud (folkvir)
 */
class FRegister extends EventEmitter {
	/**
	 * Constructor of FRegister
	 * @constructs
	 * @param {object} options - it's an object representing options avalaible
	 * @throws {FRegisterConstructException} If options is undefined and the name, spray, a broadcast and a vectore are not defined in options
	 * @returns {void}
	 */
	constructor (options) {
		super();
		this.name = options.name;
		this.spray = options.spray;
		this.vector = new VVwE(Number.MAX_VALUE);
		this.broadcast = new CausalBroadcast(this.spray, this.vector);
		this.value = {};
		const self = this;
		this.broadcast.on('receive', data => {
			// console.log('[FOGLET:' + self.name + '] Receive a new value');
			self.value = data;
			// console.log(self.value);
			/**
			 * Emit a message on the signal this.name+"-receive" with the data associated
			 */
			self.emit(self.name + '-receive', self.value);
		});

		/**
		 * AntiEntropy part in order to retreive data after an antiEntropy emit
		 */
		this.broadcast.on('antiEntropy', (id, rcvCausality, lclCausality) => {
			const data = {
				protocol: self.name,
				id: {_e: self.vector.local.e, _c: self.vector.local.v},
				payload: self.value
			};
			self.broadcast.sendAntiEntropyResponse(id, lclCausality, [ data ]);
		});

		this.status = 'initialized';
	}

	/**
	 * Get the current value of the register
	 * @function getValue
	 * @return {void}
	 */
	getValue () {
		return this.value;
	}

	/**
	 * Set the value of the register and broadcast the value to all register with the same name
	 * @function setValue
	 * @param {object} data - new Value of the register
	 * @return {void}
	 */
	setValue (data) {
		this.value = data;
		this.send();
	}

	/**
	 * Set the value of the register and broadcast the value to all register with the same name
	 * @function setValue
	 * @param {object} data - new Value of the register
	 * @return {void}
	 */
	send () {
		this.broadcast.send(this.getValue(), this.vector.increment());
	}
}

module.exports.FRegister = FRegister;