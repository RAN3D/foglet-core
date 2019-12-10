const globalOptions = {}
const reservedKeys = ['manager', 'core']

module.exports = function (core) {
  globalOptions.core = core
  globalOptions.manager = core.manager
  return {
    reservedKeys: () => reservedKeys,
    // return the global options object
    get: () => globalOptions,
    // set an options
    set: (key, value) => {
      if (reservedKeys.includes(key)) throw new Error('reserved key: ' + key + 'please choose another key')
      globalOptions[key] = value
    },
    // serialize the message options as a json string
    serialize: () => JSON.stringify(globalOptions)
  }
}
