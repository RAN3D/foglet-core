const Core = require('foglet-core')
const a = new Core({
  id: 'peer:a'
})
const b = new Core({
  id: 'peer:b'
})

async function main () {
  await a.connect(b.id)
  b.on('receive', (id, data, reply) => {
    reply(data + ' world !')
  })
  a.on('receive', (id, data, reply) => {
    console.log(`[${a.id}] received: ${data}`)
    a.disconnect(id)
  })
  a.on('connected', (peerId) => {
    a.send(peerId, 'hello')
  })
}

main().then(() => {
  console.log('Example finished.')
}).catch(e => {
  console.error(e)
  process.exit(1)
})
