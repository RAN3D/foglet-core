'use strict';

const Foglet = require('../src/foglet.js');
const utils = require('./utils.js');

describe('[SIGNALING] Direct/Signaling connections', function () {
  this.timeout(30000);
  it('direct connection, return true when connected', function (done) {
    const foglets = utils.buildFog(Foglet, 2);

    utils.pathConnect(foglets).then( (status) => {
      assert.isOk(status, 'Status Must be true.');
      done();
    }).catch(done);
  });// END IT
  it('signaling connection alone, return true when connected', function (done) {
    const foglets = utils.buildFog(Foglet, 1);
    let f1 = foglets[0];
    f1.share();
    f1.connection().then( (status) => {
      assert.isOk(status, 'Status Must be true.');
      done();
    }).catch(done);
  });// END IT
  it('signaling connection (2 peers network), return true when connected', function (done) {
    const foglets = utils.buildFog(Foglet, 2);
    let f1 = foglets[0], f2 = foglets[1];
    f1.onUnicast((id, msg) => {
      assert.equal(msg, 'ping');
      done();
    });

    f1.share();
    f1.connection().then( (status) => {
      f2.share();
      assert.isOk(status, 'Status Must be true.');
      f2.connection().then((status) => {
        assert.isOk(status, 'Status Must be true.');
        assert.equal(f2.getNeighbours().length, 1);
        f2.sendUnicast(f2.getNeighbours()[0], 'ping');
      }).catch(done);
    }).catch(done);
  });// END IT
});// END of second describe
