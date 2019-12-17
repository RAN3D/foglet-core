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
yarn add foglet-core
```
or 
```bash
git clone https://github.com/folkvir/foglet-core.git
cd foglet-core/
yarn install
# if you are a user of npm do: 
npm install -g yarn && yarn install
```

## Usage

```js
const { Core } = require('foglet-core')
const a = new Core('peer:b')
const b = new Core('peer:b')

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
