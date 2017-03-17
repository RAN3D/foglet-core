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
const uuid = require('uuid/v4');
const Q = require('q');

/**
 * SocketPing class to use with Socket.js Package
 * It provide a method to ping someone in our network (ie in our outview/inview into the socket)
 */
class SocketPing extends EventEmitter {
	/**
	 * @param {Socket} socket Socket used to communicate
	 */
	constructor (socket) {
		super();
		if(socket) {
			this.socket = socket;
			this.socket.on('receive', (message) => {
				const m = message.message || undefined;
				const peer = message.id;
				if(m && peer && m.type === 'socket-ping-protocol-start') {
					m.timeEnd = new Date().getTime();
					m.type = 'socket-ping-protocol-end';
					this.socket.send(peer, m);
				} else if (m) {
					this.emit('receive-ping'+m.pingId, m);
				}
			});
		} else {
			throw new Error('[SocketPing] Must have a socket as parameter');
		}
	}

	/**
	 * Performs a ping between us and the id provided,
	 * @param {string} idToPing Id to ping
	 * @param {number} timeout (Optionnal) Optionnal timeout but defined by default to 60 seconds
	 * @return {Promise} Return a Q Promise
	 */
	ping (idToPing, timeout = 60000) {
		return Q.Promise((resolve, reject) => {
			setTimeout(() => {
				reject(new Error('[SocketPing] Timeout !'));
			}, timeout);
			const message = {
				pingId: uuid(),
				type: 'socket-ping-protocol-start',
				timeStart: new Date().getTime()
			};
			if(this.socket.send(idToPing, message)) {
				this.once('receive-ping'+message.pingId, (ping) => {
					// second check
					if(ping.pingId === message.pingId) {
						resolve(ping.timeEnd - ping.timeStart);
					}
				});
			} else {
				reject(new Error('[SocketPing] Peer unreachable'));
			}
		});
	}

}// end class SocketPing

module.exports = SocketPing;
