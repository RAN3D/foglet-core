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

const merge = require('lodash/merge');

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
class FogletProtcol {
  constructor (name, foglet) {
    this._name = name;
    this._foglet = foglet;
  }

  namespace (name) {
    return {
      unicast: new UnicastServiceSetup(this, name),
      broadcast: new BroadCastServiceSetup(this, name)
    };
  }
}

class UnicastServiceSetup {
  constructor (protocol, namespace) {
    this._protocol = protocol;
    this._namespace = namespace;
  }

  service (name, handler) {
    this._protocol._registerUnicastHandler(`${this.namespace}/${name}`, handler);
    // return this for chained calls
    return this;
  }
}

module.exports = FogletProtcol;
