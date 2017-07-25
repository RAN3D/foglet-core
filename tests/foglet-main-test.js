'use strict';

const Foglet = require('../src/foglet.js').Foglet;
const buildFog = require('./utils.js').buildFog;

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
});
