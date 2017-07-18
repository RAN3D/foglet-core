'use strict';

const Foglet = require('../../src/foglet.js').Foglet;
const FogletProtocol = require('../../src/fprotocol/foglet-protocol.js');
const buildFog = require('../utils.js').buildFog;

class UnicastProtocol extends FogletProtocol {
  constructor (foglet, callback, done) {
    super('sample-protocol', foglet);
    this._callback = callback;
    this._done = done;
  }

  _unicast () {
    return [ 'get' ];
  }

  _get (msg, reply, reject) {
    if (this._callback) this._callback(msg, reply, reject);
    if (this._done) this._done();
  }
}

class BroadcastProtocol extends FogletProtocol {
  constructor (foglet, callback, done) {
    super('sample-protocol', foglet);
    this._callback = callback;
    this._done = done;
  }

  _broadcast () {
    return [ 'get' ];
  }

  _get (msg) {
    if (this._callback) this._callback(msg);
    if (this._done) this._done();
  }
}

describe('FogletProtocol', () => {
  describe('#unicast', () => {
    it('should receive messages from remote services', done => {
      const foglets = buildFog(Foglet, 2);
      let f1 = foglets[0], f2 = foglets[1];
      const expected = 'Hello world!';
      const p1 = new UnicastProtocol(f1),
      p2 = new UnicastProtocol(f2, msg => {
        assert.equal(msg, expected);
      }, done);

      f1.connection(f2).then(() => {
        const peers = f1.getNeighbours();
        assert.equal(peers.length, 1);
        p1.get(peers[0], expected);
      });
    });

    it('should allow peers to reply to service calls', done => {
      const foglets = buildFog(Foglet, 2);
      let f1 = foglets[0], f2 = foglets[1];
      const p1 = new UnicastProtocol(f1),
      p2 = new UnicastProtocol(f2, (msg, reply) => {
        reply(msg + ' world!');
      });

      f1.connection(f2).then(() => {
        const peers = f1.getNeighbours();
        assert.equal(peers.length, 1);
        p1.get(peers[0], 'Hello')
        .then(msg => {
          assert.equal(msg, 'Hello world!');
          done();
        })
        .catch(done);
      });
    });

    it('should allow peers to reject service calls', done => {
      const foglets = buildFog(Foglet, 2);
      let f1 = foglets[0], f2 = foglets[1];
      const p1 = new UnicastProtocol(f1),
      p2 = new UnicastProtocol(f2, (msg, reply, reject) => {
        reject(msg + ' world!');
      });

      f1.connection(f2).then(() => {
        const peers = f1.getNeighbours();
        assert.equal(peers.length, 1);
        p1.get(peers[0], 'Hello')
        .catch(msg => {
          assert.equal(msg, 'Hello world!');
          done();
        });
      });
    });
  });

  describe('#broadcast', () => {
    it('should receive messages from remote services', done => {
      const foglets = buildFog(Foglet, 2);
      let f1 = foglets[0], f2 = foglets[1];
      const expected = 'Hello world!';
      const p1 = new BroadcastProtocol(f1),
      p2 = new BroadcastProtocol(f2, msg => {
        assert.equal(msg, expected);
      }, done);

      f1.connection(f2).then(() => {
        p1.get(expected);
      });
    });
  });
});
