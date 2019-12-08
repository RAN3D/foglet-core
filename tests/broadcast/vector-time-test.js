const Assert = require('assert')
const VectorTime = require('../../lib/plugins/modules/utils/vector-time')
const ScalarTime = require('../../lib/plugins/modules/utils/scalar-time')
describe('VectorTime tests', function () {
  it('vector time', () => {
    const a = new VectorTime('A')
    a.update('B', 0)
    console.log(a)
    Assert.strictEqual(JSON.stringify(a.getTime()), JSON.stringify([{ id: 'A', counter: new ScalarTime(0) }, { id: 'B', counter: new ScalarTime(0) }]))

    a.update('B', 50)
    console.log(a)
    Assert.strictEqual(JSON.stringify(a.getTime()), JSON.stringify([{ id: 'A', counter: new ScalarTime(0) }, { id: 'B', counter: new ScalarTime(50) }]))

    a.update('A', 40)
    console.log(a)
    Assert.strictEqual(JSON.stringify(a.getTime()), JSON.stringify([{ id: 'A', counter: new ScalarTime(40) }, { id: 'B', counter: new ScalarTime(50) }]))
    Assert.strictEqual(JSON.stringify(a.local), JSON.stringify({ id: 'A', counter: new ScalarTime(40) }))
  })
})
