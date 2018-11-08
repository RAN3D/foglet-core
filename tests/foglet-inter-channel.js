const Foglet = require('../src/foglet.js')
const Communication = require('../src/network/communication/communication')
const utils = require('./utils.js')

describe('Foglet High-level communication', function (done) {
  this.timeout(20000)
  it('message should be able to be transfer on another protocol.', function (done) {
    const foglets = utils.buildFog(Foglet, 2)
    const f1 = foglets[0]
    const s1 = new Communication(f1.overlay().network, 'newProtocol')
    const s11 = new Communication(f1.overlay().network, 'toto')

    const f2 = foglets[1]
    const s2 = new Communication(f2.overlay().network, 'newProtocol')
    const s22 = new Communication(f2.overlay().network, 'toto')
    s1.onUnicast((id, message) => {
      console.log('%s S1 receive from %s:', f1.id, id, message)
      s11.sendUnicast(f2.outViewID, 'test')
    })
    s2.onUnicast((id, message) => {
      s2.sendUnicast(id, 'reply')
    })

    s11.onUnicast((id, message) => {
      console.log('%s S11 receive from %s:', f1.id, id, message)
      done()
    })
    s22.onUnicast((id, message) => {
      s22.sendUnicast(id, 'reply')
    })

    utils.pathConnect(foglets, 2000).then(() => {
      console.log(Foglet)
      s1.sendUnicast(f2.outViewID, 'test')
    }).catch(done)
  })
})
