const Assert = require('assert')
const ScalaClock = require('../../lib/plugins/modules/utils/scalar-clock')
describe('Scalar clock tests', function () {
  it('scalar clock', () => {
    const a = new ScalaClock('A')
    const b = new ScalaClock('B')
    Assert.strictEqual(a.getTime().id, 'A')
    Assert.strictEqual(a.getTime().counter.time, 0)
    // console.log(a, b)
    const ms1 = a.getTime()
    b.increment()
    Assert.strictEqual(b.getTime().id, 'B')
    Assert.strictEqual(b.getTime().counter.time, 1)
    // send ms1 to b
    Assert.strictEqual(b.isLower(ms1), false)
    // now integrate message
    b.update(ms1)
    Assert.strictEqual(b.isLower(ms1), true)
  })
})
