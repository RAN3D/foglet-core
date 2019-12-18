const EventEmitter = require('events')
module.exports = function (core) {
  const globalOptions = {}
  const options = {
    get: (id) => {
      if (!id) {
        return globalOptions
      } else {
        return globalOptions[id]
      }
    },
    // set an options
    set: (key, value) => {
      globalOptions[key] = value
    },
    // serialize the message options as a json string
    serialize: () => JSON.stringify(globalOptions),
    events: {
      manager: new EventEmitter(),
      networks: new EventEmitter(),
      layer: new EventEmitter()
    }
  }
  return options
}
