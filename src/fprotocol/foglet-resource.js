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

const FogletProtcol = require('./foglet-protocol.js');

class FogletResource extends FogletProtcol {
  constructor (name, foglet) {
    super(foglet);
    this._namespace = `resource/${name}`;
    this.unicast()
    .service('get', this._get)
    .service('post', this._post)
    .service('patch', this._patch)
    .service('delete', this._delete);
  }

  get (id) {
    return new Promise((resolve, reject) => {
      const msgID = someRandomID();
      this.unicast(id).call('get');
      this._registerAnswerHandler(msgID, resolve, reject);
    });
  }

  _get (msg, reply, reject) {
    reject(new Error('implement a get method'));
  }

  _post (msg, reply, reject) {
    reject(new Error('implement a post method'));
  }

  _patch (msg, reply, reject) {
    reject(new Error('implement a patch method'));
  }

  _delete (msg, reply, reject) {
    reject(new Error('implement a delete method'));
  }
}

module.exports = FogletResource;
