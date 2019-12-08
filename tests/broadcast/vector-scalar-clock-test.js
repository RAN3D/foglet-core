const Assert = require('assert')
const VectorClock = require('../../lib/plugins/modules/utils/vector-clock')
const ScalarClock = require('../../lib/plugins/modules/utils/scalar-clock')
describe('Vector and Scalar clock tests', function () {
  it('vecotr and scalar clock', () => {
    const tab = []
    const a = new ScalarClock('A', tab)
    const b = new VectorClock('A', tab)
    a.increment()
    a.increment()
    a.increment()
    Assert.strictEqual(a.local, b.local)
    b.increment()
    b.increment()
    b.increment()
    Assert.strictEqual(a.local, b.local)
  })
})
