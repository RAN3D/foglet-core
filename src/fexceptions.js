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

/**
 * Exception class
 * @class Exception
 * @author Grall Arnaud (folkvir)
 */
class Exception {
	/**
	 * @constructs
	 * @param {string} name - Exception name
	 * @param {string} message - Exception message
	 */
	constructor (name, message) {
		this.name = name;
		this.message = message;
	}
}

module.exports.ConstructException = class ConstructException extends Exception {
	constructor () {
		super('ConstructException', 'Error: options.protocol or options.room is undefined or null');
	}
};

module.exports.InitConstructException = class InitConstructException extends Exception {
	constructor () {
		super('InitConstructException', 'Error: options is undefined');
	}
};

module.exports.FRegisterConstructException = class FRegisterConstructException extends Exception {
	constructor () {
		super('FRegisterConstructException', 'Error: options is not well-formated');
	}
};

module.exports.FRegisterAddException = class FRegisterAddException extends Exception {
	constructor () {
		super('FRegisterAddException', 'Error: addRegister need a name argument');
	}
};
