const assert = require('assert')
const Core = require('../lib/').core
describe('Core', () => {
  it('return the version of the package.json', () => {
    const core = new Core()
    console.log(core)
    assert.strictEqual(core.options.version, require('../package.json').version)
  })
  it('Core default function create a default configuration', () => {
    const core = new Core()
    const s1 = core.default({
      id: 's1'
    }).default()
    console.log(s1)
    assert.strictEqual(s1.name, 'spray-wrtc')
    assert.strictEqual(s1.modules.has('unicast'), true)
    const s1Unicast = s1.modules.get('unicast')
    assert.strictEqual(s1Unicast.name, 'unicast')
    assert.strictEqual(s1Unicast.foglet.name, 'core')
    assert.strictEqual(s1Unicast.network.name, 'spray-wrtc')
  })
})
