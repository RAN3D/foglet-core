module.exports = class Network {
  constructor (name, options) {
    this._options = options
    this._nameClass = 'Network'
    this._name = name
    this._options.set(name, this)
    this._manager = this._options.get('manager')
  }
}
