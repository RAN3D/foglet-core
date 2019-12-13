module.exports = function (core) {
  const globalOptions = {}
  const reservedKeys = ['core']
  const options = {
    reservedKeys: () => reservedKeys,
    // return the global options object
    get: (id) => {
      if (!id) {
        return globalOptions
      } else {
        return globalOptions[id]
      }
    },
    // set an options
    set: (key, value) => {
      if (reservedKeys.includes(key)) throw new Error('reserved key: ' + key + 'please choose another key')
      globalOptions[key] = value
    },
    // serialize the message options as a json string
    serialize: () => JSON.stringify(globalOptions)
  }
  globalOptions.core = core
  return options
}
