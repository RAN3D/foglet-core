'use strict';

const Foglet = require('../src/foglet.js').Foglet;
const defineProtocol = require('../src/fprotocol/protocol-builder.js');
const buildFog = require('./utils.js').buildFog;

const UnicastProtocol = defineProtocol('sample-unicast-protocol')`
  init
  ${(self, callback, done) => {
    self._callback = callback;
    self._done = done;
  }}
  get
  ${service => {
    service.is.unicast();
    service.on.receive(function (id, msg, reply, reject) {
      if (this._callback) this._callback(id, msg, reply, reject);
      if (this._done) this._done();
    });
  }}
`;

const BroadcastProtocol = defineProtocol('sample-broadcast-protocol')`
  init
  ${(self, callback, done) => {
    self._callback = callback;
    self._done = done;
  }}
  get
  ${service => {
    service.is.broadcast();
    service.on.receive(function (id, msg) {
      if (this._callback) this._callback(id, msg);
      if (this._done) this._done();
    });
  }}
`;

describe('FogletProtocol', () => {
  describe('#unicast', () => {
    it('should receive messages from remote services', done => {
      const foglets = buildFog(Foglet, 2);
      let f1 = foglets[0], f2 = foglets[1];
      const expected = 'Hello world!';
      const p1 = new UnicastProtocol(f1),
        p2 = new UnicastProtocol(f2, (id, msg) => {
          assert.equal(msg, expected);
        }, done);

      f1.connection(f2).then(() => {
        f2.connection(f1).then(() => {
          const peers = f1.getNeighbours();
          assert.equal(peers.length, 1);
          setTimeout(function () {
            p1.get(peers[0], expected);
          }, 1000);
        });
      });
    });

    it('should allow peers to reply to service calls', done => {
      const foglets = buildFog(Foglet, 2);
      let f1 = foglets[0], f2 = foglets[1];
      const p1 = new UnicastProtocol(f1),
        p2 = new UnicastProtocol(f2, (id, msg, reply) => {
          reply(msg + ' world!');
        });

      f1.connection(f2).then(() => {
        f2.connection(f1).then(() => {
          const peers = f1.getNeighbours();
          assert.equal(peers.length, 1);
          setTimeout(function () {
            p1.get(peers[0], 'Hello')
            .then(msg => {
              assert.equal(msg, 'Hello world!');
              done();
            })
            .catch(done);
          }, 1000);
        });
      });
    });

    it('should allow peers to reject service calls', done => {
      const foglets = buildFog(Foglet, 2);
      let f1 = foglets[0], f2 = foglets[1];
      const p1 = new UnicastProtocol(f1),
        p2 = new UnicastProtocol(f2, (id, msg, reply, reject) => {
          reject(msg + ' world!');
        });

      f1.connection(f2).then(() => {
        f2.connection(f1).then(() => {
          const peers = f1.getNeighbours();
          assert.equal(peers.length, 1);
          setTimeout(function () {
            p1.get(peers[0], 'Hello')
            .then(msg => {
              done(new Error('Message should have rejected but instead got reply with ' + msg));
            })
            .catch(msg => {
              assert.equal(msg, 'Hello world!');
              done();
            });
          }, 1000);
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
        p2 = new BroadcastProtocol(f2, (id, msg) => {
          console.log(msg);
          assert.equal(msg, expected);
        }, done);

      f1.connection(f2).then(() => {
        setTimeout(function () {
          p1.get(expected);
        }, 1000);
      });
    });
  });
});
