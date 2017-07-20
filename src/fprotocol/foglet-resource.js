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

const FogletProtocol = require('./foglet-protocol.js');

/**
 * FogletResource is a simple protocol for interacting with a collection of resources using a REST interface.
 * It supports four operations:
 * * `get` to retrieve the resources
 * * `insert` to insert a new resource
 * * `update` to update a resource
 * * `delete` to delete a resource
 * You can simply extends this class and implements the correct handlers to get an easy-to-use resource
 * in a fog application.
 *
 * **Note:** a `FogletResource` only defines a protocol to interact with the resource.
 * Therefore, it's the developer task to handle all other aspect of the resource, like data consistency for example.
 * @extends FogletProtocol
 * @author Thomas Minier
 * @example
 * class StudentResource extends FogletResource {
   constructor (foglet) {
     super('students', foglet);
     this._students = [];
   }

   _get (msg, reply) {
     reply(this._students);
   }

   _insert (msg, reply) {
     this._students.push(msg.student);
     reply('new student inserted');
   }

   _update (msg, reply) {
     this._students[msg.index] = msg.student;
     reply('student updated');
   }

   _delete (msg, reply) {
     this._students.splice(msg.index, 1);
     reply('student deleted');
   }
 }
 */
class FogletResource extends FogletProtocol {
  /**
   * Constructor
   * @param  {string} name - The resource's name
   * @param  {Foglet} foglet - The foglet instance to use to communicate
   */
  constructor (name, foglet) {
    super(`foglet-core/foglet-resource/${name}`, foglet);
  }

  _unicast () {
    return [ 'get', 'insert', 'update', 'delete' ];
  }

  /**
   * Handle incoming GET requests from other peers
   * @param  {*} msg  - The GET request message
   * @param  {function} reply  - A function called to reply to the GET request
   * @param  {function} reject - A function called to reject the GET request
   * @return {void}
   */
  _get (msg, reply, reject) {
    reject(new Error('A valid FogletResource must implement a get handler'));
  }

  /**
   * Handle incoming INSERT requests from other peers
   * @param  {*} msg  - The INSERT request message
   * @param  {function} reply  - A function called to reply to the INSERT request
   * @param  {function} reject - A function called to reject the INSERT request
   * @return {void}
   */
  _insert (msg, reply, reject) {
    reject(new Error('A valid FogletResource must implement an insert handler'));
  }

  /**
   * Handle incoming UPDATE requests from other peers
   * @param  {*} msg  - The UPDATE request message
   * @param  {function} reply  - A function called to reply to the UPDATE request
   * @param  {function} reject - A function called to reject the UPDATE request
   * @return {void}
   */
  _update (msg, reply, reject) {
    reject(new Error('A valid FogletResource must implement an update handler'));
  }

  /**
   * Handle incoming DELETE requests from other peers
   * @param  {*} msg  - The DELETE request message
   * @param  {function} reply  - A function called to reply to the DELETE request
   * @param  {function} reject - A function called to reject the DELETE request
   * @return {void}
   */
  _delete (msg, reply, reject) {
    reject(new Error('A valid FogletResource must implement a delete handler'));
  }
}

module.exports = FogletResource;
