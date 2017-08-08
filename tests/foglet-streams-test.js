'use strict';

const Foglet = require('../src/foglet.js');
const utils = require('./utils.js');

localStorage.debug = 'foglet-core:*';


describe('Foglet streaming communication', function () {
  it('should stream data to a neighbour using unicast', function (done) {
    const foglets = utils.buildFog(Foglet, 2);
    let f1 = foglets[0], f2 = foglets[1];
    let acc = '';

    f2.onStreamUnicast((id, message) => {
      assert.equal(id, f1.outViewID);
      message.on('data', data => acc += data);
      message.on('end', () => {
        assert.equal(acc, 'Hello world!');
        done();
      });
    });

    utils.pathConnect(foglets).then( () => {
      setTimeout(function () {
        const peers = f1.getNeighbours();
        assert.equal(peers.length, 1);
        const stream = f1.streamUnicast(peers[0]);
        stream.write('Hello ');
        stream.write('world!');
        stream.end();
      }, 2000);
    }).catch(done);
  });

  it('should stream trailing data to a neighbour using unicast', function (done) {
    const foglets = utils.buildFog(Foglet, 2);
    let f1 = foglets[0], f2 = foglets[1];

    f2.onStreamUnicast((id, message) => {
      assert.equal(id, f1.outViewID);
      message.on('data', () => null);
      message.on('end', () => {
        assert.equal(message.trailers.length, 1);
        assert.equal(message.trailers[0], 'Hello world!');
        done();
      });
    });

    utils.pathConnect(foglets).then( () => {
      setTimeout(function () {
        const peers = f1.getNeighbours();
        assert.equal(peers.length, 1);
        const stream = f1.streamUnicast(peers[0]);
        stream.write('foo');
        stream.addTrailer('Hello world!');
        stream.end();
      }, 2000);
    }).catch(done);
  });

  it('should stream data to all peers using broadcast in a network with 2 peers', function (done) {
    const foglets = utils.buildFog(Foglet, 2);
    let f1 = foglets[0], f2 = foglets[1];
    let acc = '';

    f2.onStreamBroadcast((id, message) => {
      assert.equal(id, f1.outViewID);
      message.on('data', data => acc += data);
      message.on('end', () => {
        assert.equal(acc, 'Hello world!');
        done();
      });
    });

    utils.pathConnect(foglets).then( () => {
      setTimeout(function () {
        const stream = f1.streamBroadcast();
        stream.write('Hello ');
        stream.write('world!');
        stream.end();
      }, 2000);
    }).catch(done);
  });

  it('should stream data to all peers using broadcast in a network with 3 peers', function (done) {
    const foglets = utils.buildFog(Foglet, 3);
    let f1 = foglets[0], f2 = foglets[1], f3 = foglets[2];
    let accA = '';
    let accB = '';
    const check = utils.doneAfter(2, done);

    f2.onStreamBroadcast((id, message) => {
      assert.equal(id, f1.outViewID);
      message.on('data', data => accA += data);
      message.on('end', () => {
        assert.equal(accA, 'Hello world!');
        check();
      });
    });

    f3.onStreamBroadcast((id, message) => {
      assert.equal(id, f1.outViewID);
      message.on('data', data => accB += data);
      message.on('end', () => {
        assert.equal(accB, 'Hello world!');
        check();
      });
    });

    utils.pathConnect(foglets).then( () => {
      setTimeout(function () {
        const stream = f1.streamBroadcast();
        stream.write('Hello ');
        stream.write('world!');
        stream.end();
      }, 2000);
    }).catch(done);
  });
});
