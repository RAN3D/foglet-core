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
const FBroadcast = require('./fbroadcast');
const uuid = require('uuid/v4');
const debug = require('debug')('foglet-core:register');
const _ = require('lodash');

/**
* Create a FRegister Class, this an eventually consitent data structure, using a CausalBroadcast and a version-vector-with-exceptions from Chat-Wane (github)
* @class FRegister
* @author Grall Arnaud (folkvir)
*/
class FRegister extends EventEmitter {
  /**
  * Constructor of FRegister
  * @param {object} options - it's an object representing options avalaible
  * @returns {void}
  */
  constructor (options) {
    super();
    this.options = _.merge({
      name: 'defaultName',
      protocol: 'default',
      source: undefined
    }, options);
    if(!this.options.source) throw new Error('Error: FRegister need a valid source option.', 'fregister.js');
    this.uid = uuid();
    this.name = this.options.name;
    this.source = this.options.source;
    this.protocol = 'fregister-'+this.options.protocol;

    this.broadcast = new FBroadcast({
      rps:this.source,
      protocol:this.protocol,
      delta: 10000,
      timeBeforeStart:5000
    });
    this.value = {};

    this.broadcast.on('receive', data => {
      this.value = data;
      debug('[FREGISTER] Name:' + this.name + ', Receive a new value', this.value);
      /**
      * Emit a message on the signal this.name+"-receive" with the data associated
      */
      this.emit(this.name + '-receive', this.value);
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
  * @param {object} data - new Value of the register
  * @return {void}
  */
  setValue (data) {
    this.value = data;
    this.send();
  }

  /**
  * Send the  set value of the register
  * @return {void}
  */
  send () {
    this.broadcast.send(this.getValue());
  }
}

module.exports = FRegister;
