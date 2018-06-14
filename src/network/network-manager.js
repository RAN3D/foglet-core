/* eslint new-cap: 0 */
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

// lodash utils
const lmerge = require('lodash.merge')

// Networks
const Network = require('./network.js')
const SprayAdapter = require('./rps/sprayAdapter')
const CyclonAdapter = require('./rps/cyclon-adapter')

// debug
const debug = (require('debug'))('foglet-core:network-manager')

/**
 * A configuration object used to build an overlay
 * @typedef {Object} OverlayConfig
 * @property {string} name - Name of the overlay, used to access it with {@link NetworkManager#overlay}
 * @property {function} class - function used to instanciate the constructor with `new`
 * @property {Object} options - Dedicated options used to build the overlay
 * @property {string} options.protocol - Name of the protocol run by the overlay
 * @property {Object} options.signaling - Options used to configure the interactions with the signaling server
 * @property {string} options.signaling.address - URL of the signaling server
 * @property {string} options.signaling.room - Name of the room in which the application run
 * @example
 * {
 *  name: 'latencies-overlay',
 *  class: LatenciesOverlay,
 *  options: {
 *    protocol: 'foglet-latencies-overlay'
 *  }
 * }
 */

/**
 * A NetworkManager manage several distinct {@link Network} instances, i.e. a RPS and a set of overlays,
 * and allow peers to choose which network they want to interact with.
 * @extends EventEmitter
 * @author Grall Arnaud (folkvir)
 */
class NetworkManager extends EventEmitter {
  /**
   * Constructor
   * @param  {Object} options - Options used to build the networks
   * @param {Object} options.rps - Options used to configure the Random Peer Sampling (RPS) network
   * @param {string} options.rps.type - The type of RPS (`spray-wrtc` for Spray or `fcn-wrtc` for a fully connected network over WebRTC)
   * @param {Object} options.rps.options - Options by the type of RPS choosed
   * @param {string} options.rps.options.protocol - Name of the protocol run by the application
   * @param {Object} options.rps.options.webrtc - WebRTC dedicated options (see WebRTC docs for more details)
   * @param {number} options.rps.options.timeout - RPS timeout before definitively close a WebRTC connection
   * @param {number} options.rps.options.delta - RPS shuffle interval
   * @param {Object} options.rps.options.signaling - Options used to configure the interactions with the signaling server
   * @param {string} options.rps.options.signaling.address - URL of the signaling server
   * @param {string} options.rps.options.signaling.room - Name of the room in which the application run
   * @param {Object} options.overlay - Options used to configure custom overlay in addition of the RPS
   * @param {Object} options.overlay.options - Options propagated to all overlays, same as the options field used to configure the RPS.
   * @param {OverlayConfig[]} options.overlay.overlays - Set of config objects used to build the overlays
   */
  constructor (options) {
    super()
    this._options = lmerge({
      rps: {
        type: 'spray-wrtc',
        options: { // options will be passed to all components of the rps
          protocol: 'spray-wrtc-communication'
        }
      },
      overlays: []
    }, options)
    this._rps = this._buildRPS(this._options.rps.type, this._options.rps.options)

    // build overlay(s)
    this._overlays = new Map()
    this._buildOverlays(this._options.overlays)

    debug('Networks (Rps and overlays) initialized.')
  }

  /**
   * Select and get an overlay to use for communication using its name.
   * If no name is specified, the base RPS will be returned.
   * @param  {string} [name=null] - (optional) Name of the overlay to get. Default to the RPS.
   * @return {Network} Return the selected overlay/rps.
   */
  overlay (name = null) {
    if (name === null) { return this._rps }
    return this._overlays.get(name)
  }

  /**
   * Register a middleware, with an optional priority
   * @param  {Object} middleware   - The middleware to register
   * @param  {function} middleware.in - Function applied on middleware input
   * @param  {function} middleware.out - Function applied on middleware output
   * @param  {Number} [priority=0] - (optional) The middleware priority
   * @return {void}
   */
  registerMiddleware (middleware, priority = 0) {
    this._rps.use(middleware, priority)
    this._overlays.forEach(overlay => overlay.use(middleware, priority))
  }

  /**
   * Construct the RPS by its type and options For the moment(spray-wrtc as default)
   * @private
   * @param  {string} type    - Type of the RPS (spray-wrtc/custom/...)
   * @param  {Object} options - Options of the RPS
   * @param  {string} options.protocol - Name of the protocol run by the RPS
   * @param  {Object} options.signaling - Options used to configure the interactions with the signaling server
   * @param  {string} options.signaling.address - URL of the signaling server
   * @param  {string} options.signaling.room - Name of the room in which the application run
   * @return {Network} The constructed RPS
   */
  _buildRPS (type, options) {
    const rpsClass = this._chooseRps(type, options)
    const rps = new rpsClass(options)
    return new Network(rps, options.signaling, options.protocol)
  }

  /**
   * Get a RPS constructor given its type in string format
   * @private
   * @deprecated As only Spray is available as RPS, there is only one possible choice...
   * @param {string} type - RPS type
   * @param {Object} options - Options to pass to the RPS
   * @return {function} The RPS constructor
   */
  _chooseRps (type, options) {
    let rps = null
    switch (type) {
      case 'spray-wrtc':
        rps = SprayAdapter
        break
      case 'cyclon':
        rps = CyclonAdapter
        break
      case 'custom':
        rps = options.class
        break
      default:
        rps = SprayAdapter
        break
    }
    return rps
  }

  /**
   * Construct all overlays
   * @private
   * @param  {OverlayConfig[]} overlays - Set of overlay config objetcs
   * @return {void}
   */
  _buildOverlays (overlays) {
    if (overlays.length === 0) debug('No overlays added, only the base RPS is available')
    overlays.forEach(config => {
      this._buildOverlay(config)
    })
  }

  /**
   *
   * Build and add an overlay
   * @private
   * @throws {SyntaxError} Overlay configuration object must be a valid
   * @throws {Error} An overlay with the same name has laready been registered
   * @param {OverlayConfig} overlayConfig - Overlay configuration object
   * @return {void}
   */
  _buildOverlay (overlayConfig) {
    if (typeof overlayConfig !== 'object' || !('name' in overlayConfig) || !('class' in overlayConfig)) { throw new SyntaxError('An overlay is a configuration object {name: [string], class: [function], options: [Object]}') }
    const options = overlayConfig.options
    if (!('protocol' in options)) { throw new SyntaxError('An overlay configuration requires a protocol name, e;g. { protocol: [string] }') }

    if (!('signaling' in options)) { debug(`[WARNING] no signaling server given for overlay "${overlayConfig.name}"! Only connections from inside the same app will be allowed!`) }

    if (this._overlays.has(overlayConfig.name)) { throw new Error(`An overlay with the name "${overlayConfig.name}" has already been registered!`) }
    const overlay = new overlayConfig.class(this, options)
    this._overlays.set(overlayConfig.name, new Network(overlay, options.signaling, options.protocol))
  }
}

module.exports = NetworkManager
