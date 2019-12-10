module.exports = class Layer {
  constructor (name, options) {
    this._options = options
    this._nameClass = 'Layer'
    this._name = name
    this._options.set(name, this)
  }
}
