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
const uuid = require('uuid/v4');
const lmerge = require('lodash/merge');
const debug = require('debug');
// FOGLET
const FRegister = require('./storage/fregister.js');
const FInterpreter = require('./flib/finterpreter.js');
const FStore = require('./storage/fstore.js');
const OverlayManager = require('./overlay/OverlayManager.js');
// Networks
const AdapterFcn = require('./adapter/fcnAdapter.js');
const AdapterSpray = require('./adapter/sprayAdapter.js');

// SSH COntrol
const SSH = require('./ssh/ssh.js');
const MiddlewareRegistry = require('./utils/middleware-registry.js');

/**
* Create a Foglet Class in order to use Spray with ease
* @class Foglet
* @author Grall Arnaud (folkvir)
*/
class Foglet extends EventEmitter {
  /**
  * Constructor of Foglet
  * @constructs Foglet
  * @param {object} options - it's an object representing options avalaible
  * @throws {InitConstructException} If options is undefined
  * @throws {ConstructException} spray, protocol and room must be defined.
  * @example
  * var f = new Foglet({
  * 	spray: new Spray()
  * 	room: "your-room-name"
  * })
  * @returns {void}
  */
  constructor (options = {}) {
    super();
    this.defaultOptions = {
      webrtc: {
        trickle: true,
        iceServers: []
      },
      signalingAdress: 'http://localhost:3000',
      room: 'default-room',
      protocol: 'foglet-protocol-default',
      verbose: true,
      rpsType: 'spray-wrtc',
      useOverlayId: undefined, // you can specified the overlay used by default by foglet-core, if undefined, we use the last overlay specified, or if no overlay specified, the rps
      overlay: {
        limit: 10,
        enable: false, // use only RPS
        /**
         * List of overlay wanted.
         * You can add your own overlay by adding them here as a list of: [{class: OverlayOne, options: {...}}, {class: OverlayTwo, options: {}}, id3, id4, ...]
         * Each element has to be a Class (not initialized) or a string representing the id of default implemented Overlay
         * By default we will activate the RPS and if specified by string ids we will activate pre-implemented overlay such as {LatenciesOverlay}
         * @type {Array}
         */
        overlays: [],

        verbose: true
      },
      enableInterpreter: false
    };
    this.logger = debug('foglet-core:main');

    this.options = lmerge(this.defaultOptions, options);

     // Middlewares
    this._middlewares = new MiddlewareRegistry();

    // VARIABLES
    this.id = uuid();
    // RPS
    this.options.rps = new (this._chooseRps(this.options.rpsType))(this.options);
    this.options.rps.on('logs', (message, data) => this._log(data));

    this.inviewId = this.options.rps.inviewId;
    this.outviewId = this.options.rps.outviewId;

    // RPS && OVERLAYS
    // to use the last overlay or the rps if overlay are disable use:  om.use()
    let overlayOptions = this.options.overlay;
    overlayOptions.rps = this.options.rps;
    this.om = new OverlayManager(overlayOptions);
    // add all overlay specified;
    this._createOverlays();

    // INTERPRETER
    if(this.options.enableInterpreter) {
      this.interpreter = new FInterpreter(this);
      this.interpreter.on('logs', (message, data) => this._log(data));
    }

    // SSH COntrol
    if (this.options.ssh && this.options.ssh.address) {
      this.ssh = new SSH({
        foglet: this,
        address: this.options.ssh.address
      });
      this.ssh.on('logs', (message, data) => this._log(data));
    }

    // DATA STRUCTURES
    this.registerList = {};
    const self = this;
    this.store = new FStore({
      map : {
        views : function () {
          return self.getNeighbours();
        },
        jobs: {},
      }
    });

    this._log('Signaling server used : ' + this.options.signalingAdress + ' on the room : ' + this.options.room);
  }

  /**
  * @private
  */
  _chooseRps (rpsType) {
    let rps = null;
    switch(rpsType) {
    case 'fcn-wrtc':
      rps = AdapterFcn;
      break;
    case 'spray-wrtc':
      rps = AdapterSpray;
      break;
    default:
      rps = AdapterSpray;
      break;
    }
    return rps;
  }

  /**
   * Create all overlay
   * @return {Promise} Resolved when all overlay are well connected to the network.
   */
  _createOverlays () {
    return new Promise((resolve, reject) => {
      // engage the connection overlay process
      if(this.options.overlay.enable) {
        if(this.options.overlay.overlays.length > 0) {
          let tabs = [];
          for(let i =0; i<this.options.overlay.overlays.length; ++i) tabs.push(i);
          try {
            tabs.reduce((acc, current, index) => {
              this._log(this.options.overlay.overlays[index], index);
              return this.om.add(this.options.overlay.overlays[index]);
            }, Promise.resolve()).then(() => {
              resolve();
            }).catch((e) => {
              reject(e);
            });
          } catch (e) {
            reject(e);
          }
        } else {
          resolve(status);
        }
      } else {
        resolve(status);
      }
    });
  }

  /**
  * Connection method for Foglet to the network specified by protocol and room options
  * Firstly we connect the RPS then we added overlays specified in options
  * @param {Foglet} foglet Foglet to connect, none by default and the connection is by signaling. Otherwise it uses a direct callback
  * @param {number} timeout Time before rejecting the promise.
  * @function connection
  * @return {Promise} Return a Q.Promise
  * @example
  * var f = new Foglet({...});
  * f.connection().then((response) => console.log).catch(error => console.err);
  */
  connection (foglet = undefined, timeout = 60000) {
    if(foglet) {
      // console.log('dest: ', foglet._defaultOverlay().rps, 'src: ', this._defaultOverlay().rps);
      return this._defaultOverlay().connection(foglet._defaultOverlay().rps, timeout);
    } else {
      return this._defaultOverlay().connection(foglet, timeout);
    }
  }

  /**
   * @private
   * Return the specified overlay by its id
   * @param {string} id Id of an overlay
   * @return {object} Return the overlay use by foglet-core
   */
  _defaultOverlay (id = this.options.useOverlayId) {
    return this.om.use(id).overlay;
  }

  /**
  * Add a register to the foglet, it will broadcast new values to connected clients.
  * @function addRegister
  * @param {String} name - Name of the register
  * @throws {FRegisterAddException} Throw an exception is not defined or different of the null string
  * @returns {void}
  */
  addRegister (name) {
    const source = this._defaultOverlay();
    const options = {
      name,
      source,
      protocol: name+'-'+this.options.protocol,
    };
    const reg = new FRegister(options);
    this.registerList[this._fRegisterKey(reg)] = reg;
  }

  /**
  * Return a register by its name
  * @function getRegister
  * @param {String} name - Name of the register
  * @returns {void}
  */
  getRegister (name) {
    return this.registerList[name];
  }

  /**
   * Register a middleware, with an optional priority
   * @param  {Object} middleware   - The middleware to register
   * @param  {function} middleware.in - Function applied on middleware input
   * @param  {function} middleware.out - Function applied on middleware output
   * @param  {Number} [priority=0] - (optional) The middleware priority
   * @return {void}
   */
  use (middleware, priority = 0) {
    this._middlewares.register(middleware, priority);
  }


  /**
  * This callback is a parameter of the onRegister function.
  * @callback callback
  * @param {object} responseData - Data emits on update
  */
  /**
  * Allow to listen emits on a register when updated with a specified name and callback
  * @function onRegister
  * @param {String} name - Name of the register
  * @param {callback} callback - Callback function that handles the response
  * @returns {void}
  */
  onRegister (name, callback) {
    this.getRegister(name).on(name+'-receive', callback);
  }

  /**
  * Allow to listen on Foglet when a broadcasted message arrived
  * @function onBroadcast
  * @param {string} signal - The signal we will listen to.
  * @param {callback} callback - Callback function that handles the response
  * @returns {void}
  **/
  onBroadcast (callback) {
    this._defaultOverlay().onBroadcast((msg, ...args) => callback(this._middlewares.out(msg), ...args));
  }


  /**
  * Send a broadcast message to all connected clients.
  * @function sendBroadcast
  * @param {object} msg - Message to send.
  * @returns {void}
  */
  sendBroadcast (msg, ...args) {
    return this._defaultOverlay().sendBroadcast(this._middlewares.in(msg), ...args);
  }

  /**
  * This callback is a parameter of the onUnicast function.
  * @callback callback
  * @param {string} id - sender id
  * @param {object} message - the message received
  */
  /**
  * onUnicast function allow you to listen on the Unicast Definition protocol, Use only when you want to receive a message from a neighbour
  * @function onUnicast
  * @param {callback} callback The callback for the listener
  * @return {void}
  */
  onUnicast (callback) {
    this._defaultOverlay().onUnicast((id, msg, ...args) => callback(id, this._middlewares.out(msg), ...args));
  }

  /**
  * Send a message to a specific neighbour (id)
  * @function sendUnicast
  * @param {object} message - The message to send
  * @param {string} id - One of your neighbour's id
  * @return {boolean} return true if it seems to have sent the message, false otherwise.
  */
  sendUnicast (message, id) {
    return this._defaultOverlay().sendUnicast(this._middlewares.in(message), id);
  }

  /**
  * Get a random id of my current neighbours
  * @function getRandomPeerId
  * @return {string} return an id or a null string otherwise
  */
  getRandomNeighbourId () {
    const peers = this._defaultOverlay().getNeighbours();
    if(peers.length === 0) {
      return '';
    } else {
      try {
        const random = Math.floor(Math.random() * peers.length);
        const result = peers[random];
        return result;
      } catch (e) {
        console.err(e);
        return '';
      }
    }
  }

  /**
  * Get a list of all available neighbours in the outview
  * @function getNeighbours
  * @return {array}  Array of string representing neighbours id, if no neighbours, return an empty array
  */
  getNeighbours (k = undefined) {
    return this._defaultOverlay().getNeighbours(k);
  }

  /**
  * Return the name of a Register
  * @function _fRegisterKey
  * @private
  * @param {Register} obj - Register to return the name
  * @return {string} name - Name of the register in parameter
  */
  _fRegisterKey (obj) {
    return obj.name;
  }

  /**
  * Log by prefixing the message;
  * @function _log
  * @private
  * @param {string} msg Message to log
  * @returns {void}
  */
  _log (...args) {
    if(this.options.verbose) {
      this.logger(...args);
    }
  }
}

module.exports = { Foglet, uuid };
