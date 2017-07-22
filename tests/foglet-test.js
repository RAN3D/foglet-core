'use strict';

const Foglet = require('../src/foglet.js').Foglet;
const buildFog = require('./utils.js').buildFog;

describe('[FOGLET] Connection', function () {
  this.timeout(30000);
  it('[FOGLET] connection return true when connected', function (done) {
    const foglets = buildFog(Foglet, 2);
    let f1 = foglets[0], f2 = foglets[1];

    f1.connection(f2).then( (status) => {
      assert.isOk(status, 'Status Must be true.');
      done();
    });
  });// END IT
});// END of second describe


describe('[FOGLET:FREGISTER]', function () {
  this.timeout(30000);
  it('set a value and return the correct value', function () {
    const foglets = buildFog(Foglet, 1);
    let f1 = foglets[0];
    f1.addRegister('test');
    f1.getRegister('test').setValue('a_value');
    let result = f1.getRegister('test').getValue();
    assert.equal(result, 'a_value', 'Return the correct value');
  });

  it('onRegister()', function (done) {
    const foglets = buildFog(Foglet, 2);
    let f1 = foglets[0], f2 = foglets[1];

    f1.addRegister('test');
    f2.addRegister('test');

    f2.onRegister('test', (data) =>{
      assert.equal(data, 5);
      done();
    });

    f1.connection(f2).then( () => {
      setTimeout(() => {
        f1.getRegister('test').setValue(5);
      }, 5000);
    });
  });
});

describe('[FOGLET] Other functions tests', function () {
  this.timeout(30000);
  it('[FOGLET] getRandomNeighbourId is in getNeighbours', function (done) {
    const foglets = buildFog(Foglet, 2);
    let f1 = foglets[0], f2 = foglets[1];

    f1.connection(f2).then( () => {
      console.log('Peers: ', f1.getNeighbours(), f2.getNeighbours());
      console.log('Random:', f1.getRandomNeighbourId(), f2.getRandomNeighbourId());
      assert.include(f1.getNeighbours(), f1.getRandomNeighbourId());
      done();
    });
  });

  it('[FOGLET] _fRegisterKey()', function (done) {
    let fog = new Foglet({
      protocol:'_fRegisterKey',
      webrtc:	{
        trickle: true,
        iceServers: []
      },
      room: '_fRegisterKey'
    });

    const test = {
      name : 'test'
    };
    try {
      assert.equal(fog._fRegisterKey(test), 'test');
      done();
    } catch (error) {
      console.log(error);
      done(error);
    }
  });
});
