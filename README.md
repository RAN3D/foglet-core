Foglet-core
===========

[![Build Status](https://travis-ci.org/RAN3D/foglet-core.svg?branch=v6)](https://travis-ci.org/RAN3D/foglet-core/branches)[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

This is a complete rework of foglet-core.
Rebuilt from zero with a minimum of dependencies.
Pure JavaScript.
Made to work either with WebRTC or any other communication protocol.

## What is a foglet?

Good question, a foglet is the application created with `foglet-core`. It's also a p2p-first application. A foglet includes a Peer (you) which can communicate with other peers using the same application.

For details see (todo: github wiki)

## Installation

```bash
npm install --save foglet-core
```

## Usage

```js
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
```

## Main composition of `foglet-core`

## Library Todo list
- [x] Peers' interface
- [x] Peers' Manager interface
- [ ] Networks' interface
- [ ] Networks' Manager interface
- [ ] Module interface
-

## Documentation todo list
- [ ] at the end, do the documentation using the github wiki
