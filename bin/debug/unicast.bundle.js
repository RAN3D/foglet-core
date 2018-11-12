(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("foglet.unicast", [], factory);
	else if(typeof exports === 'object')
		exports["foglet.unicast"] = factory();
	else
		root["foglet.unicast"] = factory();
})(window, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./lib/plugins/modules/unicast/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./lib/abstract-module.js":
/*!********************************!*\
  !*** ./lib/abstract-module.js ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = class AbstractModule {
  constructor (foglet, network, options) {
    this._foglet = foglet
    this._network = network
    this._options = options
  }
  /**
   * Return the main foglet instance, the Core
   * @return {Core}
   */
  get foglet () {
    return this._foglet
  }
  /**
   * Return options of this network
   * @return {Object}
   */
  get options () {
    return this._options
  }

  /**
   * Return the parent network
   * @return {AbstractNetwork} Parent Network
   */
  get network () {
    return this._network
  }
}


/***/ }),

/***/ "./lib/plugins/modules/unicast/index.js":
/*!**********************************************!*\
  !*** ./lib/plugins/modules/unicast/index.js ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

const AbstractModule = __webpack_require__(/*! ../../../abstract-module */ "./lib/abstract-module.js")
class Unicast extends AbstractModule {
  constructor (...args) {
    super(...args)
    this.name = 'unicast'
  }
  /**
   * Listen on incoming message
   * @param {function} callback a callback called upon new message (id, message) => {....}
   * @return {void}
   */
  on (protocol, callback) {
    this.network.on('receive', (id, message) => {
      if (message.protocol === protocol) {
        try {
          callback(id, message.message)
        } catch (e) {
          console.error('Error when listening on message from %s on the protocol %s for the message: ', id, protocol, message)
        }
      }
    })
  }
  /**
   * Send a message on the protocol specified in options to the peer identified by its id
   * @param  {String} id      The identifier of the peer to send the message to
   * @param  {Object} message Data to send
   * @return {Promise} Resolved when the message is sent
   */
  send (protocol, id, message) {
    console.log('Sending data to %s on the protocol %s', id, protocol)
    return this.network.send(id, { protocol, message })
  }
}
module.exports = Unicast


/***/ })

/******/ });
});
//# sourceMappingURL=unicast.bundle.js.map