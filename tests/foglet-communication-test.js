'use strict';

const Foglet = require('../src/foglet.js');
const utils = require('./utils.js');

localStorage.debug = 'foglet-core:*';


describe('Foglet High-level communication', function () {
  it('should send messages to a neighbour using unicast', function (done) {
    const foglets = utils.buildFog(Foglet, 2);
    let f1 = foglets[0], f2 = foglets[1];

    f2.onUnicast((id, message) => {
      assert.equal(id, f1.outViewID);
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
    }).catch(done);
  });

  it('should send messages to several neighbours using multicast', function (done) {
    const foglets = utils.buildFog(Foglet, 3);
    let f1 = foglets[0], f2 = foglets[1], f3 = foglets[2];

    let wanted = 0, received = 0;
    function receive (id, message) {
      received++;
      assert.equal(id, f1.outViewID);
      assert.equal(message, 'hello');
      if(received >= wanted)
        done();
    }

    f2.onUnicast(receive);
    f3.onUnicast(receive);

    utils.pathConnect(foglets).then( () => {
      setTimeout(() => {
        const peers = f1.getNeighbours();
        wanted = peers.length;
        f1.sendMulticast(peers, 'hello');
      }, 2000);
    }).catch(done);
  });

  it('should send messages to all peers using broadcast in a network with 2 peers', function (done) {
    const foglets = utils.buildFog(Foglet, 2);
    let neighbourID = null;
    let f1 = foglets[0], f2 = foglets[1];

    f2.onBroadcast((id, data) => {
      assert.equal(id, neighbourID);
      assert.equal(data, 'hello');
      done();
    });

    utils.pathConnect(foglets).then(() => {
      neighbourID = f1.outViewID;
      setTimeout(function () {
        f1.sendBroadcast('hello');
      }, 2000);
    }).catch(done);
  });

  it('should send messages to all peers using broadcast in a network with 3 peers', function (done) {
    const foglets = utils.buildFog(Foglet, 3);
    let f1 = foglets[0], f2 = foglets[1], f3 = foglets[2];

    let cptA = 0;
    let cptB = 0;
    const results = [ '1', '2', '3', '4' ];
    const totalResult = 8;
    const check = utils.doneAfter(totalResult, done);

    utils.pathConnect(foglets).then(() => {
      f2.onBroadcast((id, message) => {
        assert.equal(id, f1.outViewID);
        assert.equal(message, results[cptA]);
        cptA++;
        check();
      });

      f3.onBroadcast((id, message) => {
        assert.equal(id, f1.outViewID);
        assert.equal(message, results[cptB]);
        cptB++;
        check();
      });

      setTimeout(() => {
        f1.sendBroadcast('1');
        f1.sendBroadcast('2');
        f1.sendBroadcast('3');
        f1.sendBroadcast('4');
      }, 2000);
    }).catch(done);
  });
});
