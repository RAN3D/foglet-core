'use strict';

const Foglet = require('../src/foglet.js').Foglet;
const buildFog = require('./utils.js').buildFog;

describe('[SIGNALING] Direct/Signaling connections', function () {
  this.timeout(30000);
  it('direct connection, return true when connected', function (done) {
    const foglets = buildFog(Foglet, 2);
    let f1 = foglets[0], f2 = foglets[1];

    f1.connection(f2).then( (status) => {
      assert.isOk(status, 'Status Must be true.');
      done();
    });
  });// END IT
  it('signaling connection alone, return true when connected', function (done) {
    const foglets = buildFog(Foglet, 1);
    let f1 = foglets[0];
    f1.share();
    f1.connection().then( (status) => {
      assert.isOk(status, 'Status Must be true.');
      done();
    });
  });// END IT
  it('signaling connection (2 peers network), return true when connected', function (done) {
    const foglets = buildFog(Foglet, 2);
    let f1 = foglets[0], f2 = foglets[1];
    f1.share();
    f1.connection().then( (status) => {
      f2.share();
      assert.isOk(status, 'Status Must be true.');
      f2.connection().then((status) => {
        assert.isOk(status, 'Status Must be true.');
        done();
      })
    });
  });// END IT
});// END of second describe
