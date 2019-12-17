const EventEmitter = require('events')
module.exports = class ManagerView extends EventEmitter {
  constructor (options, view) {
    super()
    this.options = options
    if (view) {
      this._view = view
    } else {
      this._view = new Map()
    }
  }

  add (id, bind = 'physical') {
    if (!this._view.has(id)) {
      this._view.set(id, [bind])
      this.emit('add:physical', id)
    } else {
      if (bind === 'physical') {
        throw new Error('physical connection already exists')
      } else {
        const entry = this._view.get(id)
        entry.push(bind)
        this._view.set(id, entry)
        this.emit('add:virtual', id)
      }
    }
  }

  remove (id, bind = 'physical') {
    if (this._view.has(id)) {
      const entry = this._view.get(id)
      const index = entry.indexOf(bind)
      if (index > -1) {
        entry.splice(index, 1)
      } else {
        throw new Error('You cannot remove a connection you dont own')
      }
      if (entry.length === 0) {
        this._view.delete(id)
        this.options.get('manager').layer.disconnect(id)
        this.emit('remove:physical', id)
      } else {
        this._view.set(id, entry)
      }
    } else {
      throw new Error('id not found: ' + id)
    }
  }

  get (id = undefined, bind = undefined) {
    if (!id) {
      if (bind) {
        return [...this._view].filter(e => e[1] === bind)
      } else {
        return [...this._view]
      }
    } else {
      if (!this._view.has(id)) {
        return false
      } else {
        return this._view.get(id)
      }
    }
  }

  bindPeerToNetwork (id, networkName) {
    if (this._view.has(id)) {
      let entry = this._view.get(id)
      if (entry.length === 1 && entry[0] === 'physical') {
        entry = [networkName]
      } else {
        entry.push(networkName)
      }
      this._view.set(id, entry)
    } else {
      throw new Error('[bindPeerToNetwork] peer not found: ' + id)
    }
  }

  clear () {
    this._view.clear()
  }
}
