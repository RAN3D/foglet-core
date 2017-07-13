'use strict';

let Foglet = require('../src/foglet.js').Foglet;

describe('[FOGLET] Connection', function () {
  this.timeout(30000);
  it('[FOGLET] connection return true when connected', function (done) {
    let f = new Foglet({
      verbose:true,
      protocol:'rpsExampleConnected',
      webrtc:	{
        trickle: true,
        iceServers: []
      },
      room: 'rpsExampleConnected'
    });

    let f1 = new Foglet({
      verbose:true,
      protocol:'rpsExampleConnected',
      webrtc:	{
        trickle: true,
        iceServers: []
      },
      room: 'rpsExampleConnected'
    });
    f.connection(f1).then( (status) => {
      assert(true, status, 'Status Must be true.');
      done();
    });
  });// END IT
});// END of second describe


describe('[FOGLET:FREGISTER]', function () {
  this.timeout(30000);
  it('set a value and return the correct value', function () {
    let f = new Foglet({
      protocol:'fregister',
      webrtc:	{
        trickle: true,
        iceServers: []
      },
      room: 'fregister'
    });
    f.addRegister('test');
    f.getRegister('test').setValue('a_value');
    let result = f.getRegister('test').getValue();
    assert.equal(result, 'a_value', 'Return the correct value');
  });

  it('onRegister()', function (done) {
    let f = new Foglet({
      protocol:'rpsOnregister',
      webrtc:	{
        trickle: true,
        iceServers: []
      },
      room: 'rpsOnregister'
    });

    let f2 = new Foglet({
      protocol:'rpsOnregister',
      webrtc:	{
        trickle: true,
        iceServers: []
      },
      room: 'rpsOnregister'
    });

    f.addRegister('test');
    f2.addRegister('test');

    f2.onRegister('test', (data) =>{
      assert(data, 5);
      done();
    });

    f.connection(f2).then( () => {
      setTimeout(() => {
        f.getRegister('test').setValue(5);
      }, 5000);
    });
  });
});



describe('[FOGLET] Other functions tests', function () {
  this.timeout(30000);
  it('[FOGLET] getRandomNeighbourId is in getNeighbours', function (done) {
    let f1 = new Foglet({
      protocol:'neighbours',
      webrtc:	{
        trickle: true,
        iceServers: []
      },
      room: 'neighbours'
    });
    let f2 = new Foglet({
      protocol:'neighbours',
      webrtc:	{
        trickle: true,
        iceServers: []
      },
      room: 'neighbours'
    });

    f1.connection(f2).then( () => {
      console.log('Peers: ', f1.getNeighbours(), f2.getNeighbours());
      console.log('Random:', f1.getRandomNeighbourId(), f2.getRandomNeighbourId());
      assert(f1.getNeighbours().includes(f1.getRandomNeighbourId()));
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
      assert(fog._fRegisterKey(test), 'test');
      done();
    } catch (error) {
      console.log(error);
      done(error);
    }
  });
});
