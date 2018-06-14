const cods = require('../../src/cods/cods.js')

class Register {
  constructor () {
    this._value = null
  }

  read () {
    return this._value
  }

  write (v) {
    this._value = v
  }
}

cods.specifyOperations(Register, ['read'], ['write'])

class SlidingWindow {
  constructor (k) {
    this._windows = Array.apply(null, { length: k }).fill(0)
  }

  read () {
    return this._windows
  }

  write (v) {
    this._windows.pop()
    this._windows.push(v)
  }
}

cods.specifyOperations(SlidingWindow, ['read'], ['write'])

module.exports = {
  Register,
  SlidingWindow
}
