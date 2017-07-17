/*
MIT License

Copyright (c) 2016-2017 Grall Arnaud

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

/**
 * FogletProtcol represent an abstract protocol.
 *
 * A Protocol is a a set of behaviours used to interact with others foglet that shares the same protocol.
 * It contains:
 * * rules, i.e. anonymous functions, to execute when receving specific message (by unicast and/or broadcast)
 * *
 * @abstract
 * @author Thomas Minier
 */
class FogletProtocol {
  constructor (name, foglet) {
    this._name = name;
    this._foglet = foglet;
    this._unicastHandlers = new Map();
    this._broadcastHandlers = new Map();
    this._buildProtocol();
    this._enableHandlers();
  }

  _unicast () {
    return [];
  }

  _broadcast () {
    return [];
  }

  _buildProtocol () {
    // TODO refactore to reduce code duplicata in this method
    this._unicast().forEach(method => {
      // create service method to call this service in unicast
      if (method in this)
        throw new SyntaxError(`Cannot create a new service for protocol ${this._name} if the method ${method} is already defined`);
      this[method] = (id, payload) => {
        console.log('send message');
        this._foglet.sendUnicast({
          protocol: this._name,
          method,
          payload
        }, id);
        // TODO add mecanism for reply and reject to resolve promise (for now, set to auto-resolve)
        return Promise.resolve();
      };
      // register handler
      if (!(`_${method}` in this))
        throw new SyntaxError(`The handler '_${method}' is not defined in the prtotype of the protocol ${this._name}`);
      this._unicastHandlers.set(`${this._name}/${method}`, `_${method}`);
    });

    // do the same for broadcast service
    this._broadcast().forEach(method => {
      // create service method to call this service in unicast
      if (method in this)
        throw new SyntaxError(`Cannot create a new service for protocol ${this._name} if the method ${method} is already defined`);
      this[method] = payload => {
        console.log('send message');
        this._foglet.sendBroadcast({
          protocol: this._name,
          method,
          payload
        });
        // TODO add mecanism for reply and reject to resolve promise (for now, set to auto-resolve)
        return Promise.resolve();
      };
      // register handler
      if (!(`_${method}` in this))
        throw new SyntaxError(`The handler '_${method}' is not defined in the prtotype of the protocol ${this._name}`);
      this._broadcastHandlers.set(`${this._name}/${method}`, `_${method}`);
    });
  }

  _enableHandlers () {
    this._foglet.onUnicast((id, msg) => {
      const msgType = `${msg.protocol}/${msg.method}`;
      if (this._unicastHandlers.has(msgType)) {
        const handlerName = this._unicastHandlers.get(msgType);
        this[handlerName](msg.payload); // TODO add reply and reject callbacks
      }
    });
    this._foglet.onBroadcast(msg => {
      const msgType = `${msg.protocol}/${msg.method}`;
      if (this._broadcastHandlers.has(msgType)) {
        const handlerName = this._broadcastHandlers.get(msgType);
        this[handlerName](msg.payload); // TODO add reply and reject callbacks
      }
    });
  }
}

module.exports = FogletProtocol;
