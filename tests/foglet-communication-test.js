'use strict';

const Foglet = require('../src/foglet.js').Foglet;
const utils = require('./utils.js');

localStorage.debug = 'foglet-core:*';


describe('[COMMUNICATION] Unicast/Broadcast', function () {
  it('[Broadcast-simple] sendBroadcast/onBroadcast', function (done) {
    const foglets = utils.buildFog(Foglet, 2);
    let neighbourID = null;
    let f1 = foglets[0], f2 = foglets[1];

    f2.onBroadcast((id, data) => {
      console.log(id, data);
      assert.equal(id, neighbourID);
      assert.equal(data, 'hello');
      done();
    });

    utils.pathConnect(foglets).then(() => {
      neighbourID = f1.outviewId;
      setTimeout(function () {
        f1.sendBroadcast('hello');
      }, 2000);
    });
  });

  it('[Unicast-simple] sendUnicast/onUnicast', function (done) {
    const foglets = utils.buildFog(Foglet, 2);
    let f1 = foglets[0], f2 = foglets[1];

    f2.onUnicast((id, message) => {
      console.log(id + ' : ' + message);
      assert.equal(message, 'hello');
      done();
    });

    utils.pathConnect(foglets).then( () => {
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

  it('[Unicast-complex] sendMulticast', function (done) {
    const foglets = utils.buildFog(Foglet, 2);
    let f1 = foglets[0], f2 = foglets[1];

    let wanted = 0, received = 0;
    function receive (id, message) {
      received++;
      assert.equal(message, 'hello');
      if(received === wanted) done();
    }

    f2.onUnicast((id, message) => {
      console.log(id + ' : ' + message);
      receive(id, message);
    });


    utils.pathConnect(foglets).then( () => {
      setTimeout(() => {
        let peers = f1.getNeighbours();
        wanted = peers.length;
        f1.sendMulticast(peers, 'hello').then(() => {
          console.log('Multicast sent to ', peers);
        }).catch(done);
      }, 2000);
    });
  });

  it('[Broadcast-complex] sendBroadcast with ordered message on 3 peers network', function (done) {
    const foglets = utils.buildFog(Foglet, 3);
    let f1 = foglets[0], f2 = foglets[1], f3 = foglets[2];

    let cptA = 0;
    let cptB = 0;
    const results = [ '1', '2', '3', '4' ];
    const totalResult = 8;
    const check = utils.doneAfter(totalResult, done);

    utils.pathConnect(foglets).then(() => {
      f2.onBroadcast((id, message) => {
        assert.equal(message, results[cptA]);
        cptA++;
        check();
      });

      f3.onBroadcast((id, message) => {
        assert.equal(message, results[cptB]);
        cptB++;
        check();
      });

      const ec1 = f1.sendBroadcast('1');
      f1.sendBroadcast('2', ec1);

      const ec2 = f1.sendBroadcast('3');
      f1.sendBroadcast('4', ec2);
    }).catch(done);
  }); // end it
});
