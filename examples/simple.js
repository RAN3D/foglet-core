console.log(require('../foglet-core'))
const { Core } = require('../foglet-core')
const { FullConnected } = require('../foglet-core').Networks
const { LocalLayer } = require('../foglet-core').Layers

const a = new Core('peer:a')
const anet = new FullConnected('full', a.options)
a.manager.addLayer(new LocalLayer('local', a.options))
console.log(a.options.serialize())

const b = new Core('peer:b')
const bnet = new FullConnected('full', b.options)
b.manager.addLayer(new LocalLayer('local', b.options))
console.log(b.options.serialize())

async function main () {
  await a.manager.connect()
  await b.manager.connect()
}

main().then(async () => {
  console.log('connected')
  console.log('A:', a.manager.neighbours)
  console.log('B:', b.manager.neighbours)

  // create the network managing A

}).catch(e => {
  console.error(e)
})
