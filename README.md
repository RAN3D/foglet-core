**DONT USE THIS VERSION**


Foglet-core
===========

[![Build Status](https://travis-ci.org/RAN3D/foglet-core.svg?branch=master)](https://travis-ci.org/RAN3D/foglet-core) [![npm version](https://badge.fury.io/js/foglet-core.svg)](https://badge.fury.io/js/foglet-core) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![Documentation Status](https://readthedocs.org/projects/foglet/badge/?version=latest)](https://foglet.readthedocs.io/en/latest/?badge=latest)

[![NPM](https://nodei.co/npm/foglet-core.png)](https://npmjs.org/package/foglet-core)

Easy use of WebRTC Networks with embedded network management and simple communication primitives.

## Install

```
npm install --save foglet-core
```

## Example

```javascript
const Core = require('foglet-core').core

// Initialize a foglet with as id peer1 with a Spray Network and a Unicast module
const foglet1 = new Core()
const f1 = foglet1.default({
  n2n: {
    id: 'peer1'
  }
}).default()
// Initialize a foglet with as id peer2 with a Spray Network and a Unicast module
const foglet2 = new Core()
const f2 = foglet2.default({
  n2n: {
    id: 'peer2'
  }
}).default()

// Get unicast module
const f1unicast = f1.module('unicast')
const f2unicast = f2.module('unicast')
// listen on incoming message on the channel 'mychannel'
f1unicast.on('mychannel', (id, message) => {
  console.log('[%s] Receive a message from %s: ', f1.id, id, message) // should see 'meow'
})
// listen on incoming message on the channel 'mychannel'
f2unicast.on('mychannel', (id, message) => {
  console.log('[%s] Receive a message from %s: ', f2.id, id, message) // should see 'reply'
  f2unicast.send('mychannel', id, 'reply') // reply to the sender the message 'reply'
})
// send a message on the channel 'mychannel'
f1unicast.send('mychannel', 'peer2', 'meow')

// get networks from the core
// Create a core
const core = new Core()
// Initialize default networks and modules
const networkOptions = {}
const moduleOptions = {}
core.default(networkOptions).default(moduleOptions)
// get a Map of all available networks
core.networks() // return a Map of available networks
// get the network with the name 'spray-wrtc'
core.network('spray-wrtc')
// add a new network
const AbstractNetwork = require('foglet-core').abstract.network
const MyNetworkClass = class extends AbstractNetwork {}
const n = core.addNetwork('mynetworkname', MyNetworkClass, MyClassOptions)
// initialize default module for this new network
n.default() // here at least unicast => n.module('unicast')
// add a new module on a network
const AbstractModule = require('foglet-core').abstract.module
const MyModuleClass = class extends AbstractModule {}
core.network('mynetworkname').addModule('mymodulename', MyModuleClass, MyModuleOptions)
// get a module on specified network
core.network('mynetworkname').module('mymodulename')
```

## Tests

Before everything run the signaling server, either in node or docker. (your choice)

```bash
# Docker
cd ./tests/signaling-server
docker build -t signaling .
docker run -d -p 5000:5000 --name signaling -e "PORT=5000" -e "HOST=localhost" signaling
# Or using just Nodejs
npm run signaling
```

Then: `npm test`

## Contributors:

* [A. Grall (Folkvir)](https://github.com/folkvir)
* [T. Minier (Callidon)](https://github.com/Callidon)
* [B. Nédelec (Chat-Wane)](https://github.com/Chat-Wane/)

<div style='text-align:center'>
<img src="https://octodex.github.com/images/socialite.jpg" width="200" style='text-align:center'><img src="https://octodex.github.com/images/collabocats.jpg" width="200" style='text-align:center'><img src="https://octodex.github.com/images/socialite.jpg" width="200" style='text-align:center'>
<hr/>
</div>


### Developments Notes (For us only)

```bash
# step 1, setup heroku deploy
travis setup heroku # dont work
# step 2, tried: generate the heroku api_key for signaling-v2, for travis.com (--pro or --com)
travis encrypt $(heroku authorizations:create) --add deploy.api_key --pro # dont work
# step 3, tried: generate the heroku api_key for signaling-v2, for travis.org (--org)
travis encrypt $(heroku authorizations:create) --add deploy.api_key --org # dont work
# step 4, generate an auth from heroku, and add $HEROKU_AUTH_TOKEN in travis.yml
```
