'use strict';

const Foglet = require('../src/foglet.js').Foglet;
const buildFog = require('./utils.js').buildFog;

describe('[FSTORE] FStore functions', function () {
  it('[FStore] init', function () {
    const foglets = buildFog(Foglet, 1);
    let f = foglets[0];

    console.log(f.store.getStore());
    assert.isOk(f.store.has('views'));
  });

  it('[FStore] insert', function () {
    let f = new Foglet({
      protocol: 'fstore-test-insert',
      webrtc:	{
        trickle: false,
        iceServers: []
      },
      room: 'fstore-test-insert'
    });

    f.store.insert('testingValue', { 'a' : 1 });
    console.log(f.store.getStore());
    assert.isOk(f.store.has('testingValue'));
    assert.isObject(f.store.get('testingValue'));
    assert.equal(f.store.get('testingValue').a, 1);
  });

  it('[FStore] update', function () {
    const foglets = buildFog(Foglet, 1);
    let f = foglets[0];

    f.store.insert('testingValue', { 'a' : 1 });
    console.log(f.store.getStore());
    assert.isOk(f.store.has('testingValue'));
    assert.isObject(f.store.get('testingValue'));
    assert.equal(f.store.get('testingValue').a, 1);
    f.store.update('testingValue', { 'a' : 2 });
    console.log(f.store.getStore());
    assert.equal(f.store.get('testingValue').a, 2);
  });

  it('[FStore] delete', function () {
    const foglets = buildFog(Foglet, 1);
    let f = foglets[0];

    f.store.insert('testingValue', { 'a' : 1 });
    assert.isOk(f.store.has('testingValue'));
    f.store.delete('testingValue');
    assert.isNotOk(f.store.has('testingValue'));
  });
});
