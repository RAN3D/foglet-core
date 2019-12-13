console.log(require('../foglet-core'))
const { Core } = require('../foglet-core')
const { FullConnected } = require('../foglet-core').Networks
const { LocalLayer } = require('../foglet-core').Layers

const a = new Core('peer:a')
a.on('data', console.log)
a.manager.addNetwork(new FullConnected('full', a.options))
a.manager.addLayer(new LocalLayer('local', a.options))
console.log(a.options.serialize())

const b = new Core('peer:b')
b.on('data', console.log)
b.manager.addNetwork(new FullConnected('full', b.options))
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

  // send a message for networks modules
  await b.manager.send(a.id, 'NETWORK: hello world')

  // send an application message
  await b.send(a.id, 'APPLICATION: hello world')
}).catch(e => {
  console.error(e)
})
