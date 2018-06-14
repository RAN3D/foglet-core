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
'use strict'

const EventEmitter = require('events')

/**
 * AbstractNetwork represents an abstract network layer
 * @abstract
 * @author Grall Arnaud (Folkvir)
 */
class AbstractNetwork extends EventEmitter {
  /**
   * Constructor
   * @param {Object} options - Additional options used to build the network
   */
  constructor (options) {
    super()
    this._rps = this._buildRPS(options)
    this._options = options
    // make a unique id of this network
    this._id = this._rps.PEER
  }
  /**
   * Return a unique identifier of the peer
   * @return {String} The identifier of the peer
   */
  get id () {
    return this._id
  }

  /**
   * The Random Peer Sampling Network itself
   * @return {*} The Random Peer Sampling Network
   */
  get rps () {
    return this._rps
  }

  /**
   * The in-view ID of the peer in the network
   * @return {string} The in-view ID of the peer
   */
  get inviewId () {
    throw new Error('A valid network must implement a inviewId getter')
  }

  /**
   * The out-view ID of the peer in the network
   * @return {string} The out-view ID of the peer
   */
  get outviewId () {
    throw new Error('A valid network must implement a outviewId getter')
  }

  /**
   * Build the RPS for this network.
   * Subclasses of {@link AbstractNetwork} **must** implement this method.
   * @param {Object} options - Options used to build the RPS
   * @return {*} The network used as RPS/overlay
   */
  _buildRPS (options) {
    throw new Error('A valid network must implement a _buildRPS method using options', options)
  }

  /**
   * Get the IDs of all available neighbours
   * @param  {integer} limit - Max number of neighbours to look for
   * @return {string[]} Set of IDs for all available neighbours
   */
  getNeighbours (limit) {
    throw new Error('A valid network must implement a getNeighbours method with limit', limit)
  }
}

module.exports = AbstractNetwork
