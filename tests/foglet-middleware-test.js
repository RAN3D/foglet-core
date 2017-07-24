'use strict';

const Foglet = require('../src/foglet.js').Foglet;
const buildFog = require('./utils.js').buildFog;

const simpleMiddleware = {
  in: msg => msg + ' and Thanks for',
  out: msg => msg + ' all the Fish'
};

describe('Middlewares', function () {
  this.timeout(30000);
  it('should use middleware on broadcast', function (done) {
    const foglets = buildFog(Foglet, 2);
    let f1 = foglets[0], f2 = foglets[1];

    f1.use(simpleMiddleware);
    f2.use(simpleMiddleware);

    f2.onBroadcast((id, data) => {
      assert(data === 'So Long and Thanks for all the Fish');
      done();
    });

    f1.connection(f2).then( () => {
      setTimeout(function () {
        f1.sendBroadcast('So Long');
      }, 2000);
    });
  });

  it('should use middleware on unicast', function (done) {
    const foglets = buildFog(Foglet, 2);
    let f1 = foglets[0], f2 = foglets[1];

    f1.use(simpleMiddleware);
    f2.use(simpleMiddleware);

    f2.onUnicast((id, message) => {
      assert(message === 'So Long and Thanks for all the Fish');
      done();
    });

    f1.connection(f2).then( () => {
      setTimeout(function () {
        const peers = f1.getNeighbours();
        assert(peers.length === 1);
        f1.sendUnicast(peers[0], 'So Long');
      }, 2000);
    });
  });
});
