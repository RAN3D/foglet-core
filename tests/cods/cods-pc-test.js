const assert = require('chai').assert
const Foglet = require('../../src/foglet.js')
const cods = require('../../src/cods/cods.js')
const utils = require('../utils.js')

class Register {
  constructor () {
    this._value = null
  }

  read () {
    return this._value
  }

  write (v) {
    this._value = v
  }
}

cods.specifyOperations(Register, [], ['write'])

describe('[FOGLET-CODS] Shared objects - Pipeline consistency', function () {
  this.timeout(20000)
  it('[FOGLET-CODS] should propagate update between peers', function (done) {
    const foglets = utils.buildFog(Foglet, 2)
    const f1 = foglets[0]
    const f2 = foglets[1]

    utils.pathConnect(foglets, 2000).then(() => {
      const r1a = cods.connect('r1', f1, cods.PC, new Register())
      const r1b = cods.connect('r1', f2, cods.PC, new Register())
      // nothing has been written yet
      assert.isNull(r1a.read())
      assert.isNull(r1b.read())
      // f1 writes in register r1
      r1a.write(1)
      assert.equal(r1a.read(), 1)
      setTimeout(() => {
        assert.equal(r1b.read(), 1)

        // f1 writes in register r1
        r1b.write(2)
        assert.equal(r1b.read(), 2)
        setTimeout(() => {
          assert.equal(r1a.read(), 2)

          // cleanup
          utils.clearFoglets(foglets).then(() => done())
        }, 100)
      }, 100)
    }).catch(done)
  })
})
