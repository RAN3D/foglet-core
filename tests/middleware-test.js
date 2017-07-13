'use strict';

const Foglet = require('../src/foglet.js').Foglet;

const simpleMiddleware = {
  in: msg => msg + ' and Thanks for',
  out: msg => msg + ' all the Fish'
};

describe('Middlewares', function () {
  this.timeout(30000);
  it('should use middleware on broadcast', function (done) {
    let f1 = new Foglet({
      protocol:'test-broadcast-middleware',
      webrtc:  {
        trickle: true,
        iceServers: []
      },
      room: 'test-broadcast-middleware'
    });
    let f2 = new Foglet({
      protocol:'test-broadcast-middleware',
      webrtc:  {
        trickle: true,
        iceServers: []
      },
      room: 'test-broadcast-middleware'
    });

    f1.use(simpleMiddleware);
    f2.use(simpleMiddleware);

    f2.onBroadcast(data => {
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
    let f1 = new Foglet({
      protocol:'test-unicast-middleware',
      webrtc:  {
        trickle: true,
        iceServers: []
      },
      room: 'test-unicastroom-middleware'
    });

    let f2 = new Foglet({
      protocol:'test-unicast-middleware',
      webrtc:  {
        trickle: true,
        iceServers: []
      },
      room: 'test-unicastroom-middleware'
    });

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
        f1.sendUnicast('So Long', peers[0]);
      }, 2000);
    });
  });
});
