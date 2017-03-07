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
const FBroadcast = require('./fbroadcast.js').FBroadcast;
const Unicast = require('unicast-definition');
const serialize = require('serialize-javascript');
const FStore = require('./fstore.js').FStore;
const uuid = require('uuid/v4');

class Command {
	constructor (options) {
		// Instance a job on a peer
		this.type = options.type || 'normal';
		this.callback = serialize(options.callback) || serialize(d => console.log(d));
		this.value = options.value;
		this.jobId = options.jobId;
		// For querying internal functions
		this.name = options.name;
		this.args = options.args;
	}
}

class FInterpreter extends EventEmitter {
	/**
	 * @constructor
	 * @param {Foglet} foglet This is the parent object in order to get all foglet basics operations
	 */
	constructor (foglet) {
		super();
		this.foglet = foglet;
		this.protocol = 'interpreter';

		this.broadcast = new FBroadcast({
			protocol: this.protocol+ '-' + foglet.room,
			foglet: this.foglet,
			size:1000
		});

		this.unicast = new Unicast(this.foglet.options.spray, this.protocol + '-unicast');

		this.signalCustomBroadcast = this.protocol + '-broadcast-custom';
		this.signalBroadcast = this.protocol + '-broadcast';
		this.signalUnicast = this.protocol + '-unicast';

		this.properties = Object.getOwnPropertyNames(Object.getPrototypeOf(this.foglet));
		// We delete constructor and init
		this.properties = this.properties.slice(2, this.properties.length);

		// Allow to generate uuid
		this.uid = uuid();

		const self = this;

		this.emitter =  (jobId, key, val) => {
			let newValue = { jobId };
			newValue[key] = val;
			self.foglet.interpreter._sendBroadcast(new Command({
				type: 'customResponse',
				value: newValue
			}));
		};

		this.broadcast.on('receive', message => {
			self._receiveBroadcast (message);
		});

		this.unicast.on('receive', (id, message) => {
			self._receiveUnicast (id, message);
		});

	}



	/**
	 * This a remote Custom function that execute a job at all peers of the network
	 * @function remoteCustom
	 * @param {string} value - name of the foglet function to execute
	 * @param {mapper} callback Mapper callback
	 * @return {boolean} Return the status of the broadcast
	 */
	remoteCustom (value, callback) {
		let command = new Command({
			type: 'custom',
			value,
			callback,
			jobId : uuid()
		});
		return this._sendBroadcast(command);
	}

	/**
	 * This a remote Broadcast function that execute a foglet command for all peers f the network
	 * @function remoteBroadcast
	 * @param {string} name - name of the foglet function to execute
	 * @param {array} args - Array or arguments matching the function to execute
	 * @return {boolean|object} Return true if the broadcast is correct otherwise false or an error
	 */
	remoteBroadcast (name, args) {
		if(typeof name === 'string' && Array.isArray(args)) {
			let command  = new Command({name, args});
			let result;
			try {
				if(command && command.name && command.args) {
					if (this.properties.includes(command.name) && this.foglet[command.name].length === command.args.length) {
						return this._sendBroadcast(command);
					} else {
						result = false;
					}
				}else{
					result = false;
				}
			} catch (e) {
				result = e;
			}

			return result;
		}else{
			return false;
		}
	}

	/**
	 * This a remote Unicast function that execute a foglet command at a Neighbour provided
	 * @function remoteUnicast
	 * @param {string} name - name of the foglet function to execute
	 * @param {array} args - Array or arguments matching the function to execute
	 * @param {string} id - id of the peer to send the remote function
	 * @return {boolean|object} Return true if the unicast is correct otherwise false or an error
	 */
	remoteUnicast (name, args, id) {
		if(typeof name === 'string' && Array.isArray(args)) {
			let command  = new Command({name, args});
			let result;
			try {
				if(command && command.name && command.args) {
					if (this.properties.includes(command.name) && this.foglet[command.name].length === command.args.length) {
						return this._sendUnicast(command, id);
					} else {
						result = false;
					}
				}else{
					result = false;
				}
			} catch (e) {
				result = e;
			}

			return result;
		}else{
			return false;
		}
	}

	/**
	 * This mapper callback is a parameter of the mapReduce function.
	 * @callback mapper
	 * @param {string} jobId - Id of the current job
	 * @param {Foglet} foglet - Peer foglet
	 * @param {object} value - Value of the key in the peer store
	 * @param {function} emitter - This object is the emitter function in order to send back data,
	 * @example emitter(jobId, key, val)
 	 */
	/**
	 * This reducer callback is a parameter of the mapReduce function.
	 * @callback reducer
	 * @param {object} message - It's the entire message received
	 */
	/**
	 * Construct a job Map/reduce
	 * @function mapReduce
	 * @param {string} key The key to find in the local store  of the peer where the job is received
	 * @param {mapper} mapper - It's is the callback mapper function
	 * @param {reducer} reducer - It's the callback reducer function
	 * @return {void}
	 * @example
	 * let c = foglet.interpreter.mapReduce('views', (jobId, foglet, val, emitter) => {
	 * 	emitter(jobId, 'myKeys', val);
	 * }, (message) => {
	 * 	const val = message.value;
	 * 	console.log(val); // Will produce { jobId : '....', 'mykeys' : { .... } }
	 * });
	 */
	mapReduce (key, mapper, reducer) {
		this.remoteCustom(key, mapper);
		this.on(this.signalCustomBroadcast, reducer);
	}

	/**
	 * *****************************************************
	 * ********************* PRIVATE FUNCTIONS *************
	 * *****************************************************
	 */

	/**
 	 * @private
 	 * Function activate when a broadcast message is received
 	 * @function _receiveBroadcast
	 * @param {object} message - The message received
 	 * @return {void}
 	 */
	_receiveBroadcast (message) {
		let result = null;
		if(message.type === 'custom') {
			this._receiveCustomBroadcast(message);
		}else if (message.type === 'customResponse') {
			this.emit(this.signalBroadcast+'-custom', message);
		} else {
			result = this.foglet[message.name](...message.args);
			this.emit(this.signalBroadcast, result, message);
		}
	}

	/**
	 * @private
	 * Function activate when a custom broadcast message is received
	 * @function _receiveCustomBroadcast
	 * @param {object} message - The message received
	 * @return {void}
	 */
	_receiveCustomBroadcast (message) {
		const val = this.foglet.store.get(message.value) && this.foglet.store.get(message.value);
		let callback = this._deserialize(message.callback);
		if(typeof val === 'function') {
			callback(message.jobId, this.foglet, val(), this.emitter); // add an emitter in order to send back results
		} else {
			callback(message.jobId, this.foglet, val, this.emitter); // add an emitter in order to send back results
		}
	}

	/**
	 * @private
	 * Function activate when a unicast message is received
	 * @function _receiveUnicast
	 * @param {string} id - Id of the received peer message
	 * @param {object} message - The message received
	 * @return {void}
	 */
	_receiveUnicast (id, message) {
		const result = this.foglet[message.name](...message.args);
		this.emit(this.signalUnicast, result, id, message);
	}

	/**
	 * @private
	 * Send a broadcast message as foglet sendBroadcast method but on our protocol
	 * @function _sendBroadcast
	 * @param {object} message - The message to send
	 * @return {void}
	 */
	_sendBroadcast (message) {
		return this.broadcast.send(message);
	}

	/**
	 * @private
	 * Send a unicast message to a specified peer as foglet sendUnicast method but on our protocol
	 * @function _sendUnicast
	 * @param {object} message - The message to send
	 * @param {string} peerId - Id of the peer to send the message
	 * @return {void}
	 */
	_sendUnicast (message, peerId) {
		return this.unicast.send(message, peerId);
	}

	/**
	 * @private
	 * Deserialize a javascript serialized string
	 * @function _deserialize
	 * @param {string} serializedJavascript - The string to deserialized
	 * @return {object} The deserialized string
	 */
	_deserialize (serializedJavascript) {
		return eval('(' + serializedJavascript + ')');
	}

	/**
	 * @private
	 * Log the message provided
	 * @function _flog
	 * @param {object} message - The message to log
	 * @return {void}
	 */
	_flog (message) {
		this.foglet._flog('[Interpreter]' + message);
	}

}

module.exports = { FInterpreter };
