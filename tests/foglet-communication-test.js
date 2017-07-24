'use strict';

const Foglet = require('../src/foglet.js').Foglet;
const buildFog = require('./utils.js').buildFog;

describe('[COMMUNICATION] Unicast/Broadcast', function () {
  this.timeout(30000);

  it('[Broadcast-simple] sendBroadcast/onBroadcast', function (done) {
    const foglets = buildFog(Foglet, 2);
    let neighbourID = null;
    let f1 = foglets[0], f2 = foglets[1];

    f2.onBroadcast((id, data) => {
      console.log(id, data);
      assert.equal(id, neighbourID);
      assert.equal(data, 'hello');
      done();
    });

    f1.connection(f2).then(() => {
      neighbourID = f1.outviewId;
      setTimeout(function () {
        f1.sendBroadcast('hello');
      }, 2000);
    });
  });
  it('[Unicast-simple] sendUnicast/onUnicast', function (done) {
    const foglets = buildFog(Foglet, 2);
    let f1 = foglets[0], f2 = foglets[1];

    f2.onUnicast((id, message) => {
      console.log(id + ' : ' + message);
      assert.equal(message, 'hello');
      done();
    });

    f1.connection(f2).then( () => {
      setTimeout(function () {
        const peers = f1.getNeighbours();
        assert.equal(peers.length, 1);
        console.log(peers);
        for(let i = 0; i < peers.length; i++) {
          f1.sendUnicast(peers[i], 'hello');
        }
      }, 2000);
    });
  });
  it('[Broadcast-complex] sendBroadcast with ordered message on 3 peers network', function (done) {
    const foglets = buildFog(Foglet, 3);
    let f1 = foglets[0], f2 = foglets[1], f3 = foglets[2];

    let cptA = 0;
    let cptB = 0;
    const results = [ '1', '2', '3', '4' ];
    const totalResult = 8;

    f1.connection(f2).then(() => {
      f2.connection(f3).then(() => {
        f2.onBroadcast((id, message) => {
          assert.equal(message, results[cptA]);
          cptA++;
          if ((cptA + cptB) >= totalResult)
            done();
        });

        f3.onBroadcast((id, message) => {
          assert.equal(message, results[cptB]);
          cptB++;
          if ((cptA + cptB) >= totalResult)
            done();
        });

        const ec1 = f1.sendBroadcast('1');
        f1.sendBroadcast('2', ec1);

        const ec2 = f1.sendBroadcast('3');
        f1.sendBroadcast('4', ec2);
      }).catch(error => {
        console.log(error);
        done(error);
      });
    });
  }); // end it
});
