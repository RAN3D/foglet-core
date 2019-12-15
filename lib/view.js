const EventEmitter = require('events')
module.exports = class View {
  constructor (options, view) {
    this.options = options
    if (view) {
      this._view = view
    } else {
      this._view = new Map()
    }
    this.events = new EventEmitter()
  }

  add (id) {
    if (!this._view.has(id)) {
      this._view.set(id, 1)
      this.events.emit('add:physical', id)
    } else {
      const entry = this._view.get(id)
      entry.occ++
      this._view.set(id, entry)
      this.events.emit('add:virtual', id)
    }
  }

  remove (id) {
    if (this._view.has(id)) {
      const entry = this._view.get(id)
      entry.occ--
      if (entry.occ === 0) {
        // console.log('occurence is zero; delete the physical connection for all alyers')
        this._view.delete(id)
        this.options.get('manager').layer.disconnect(id)
        this.events.emit('remove:physical', id)
      } else {
        this._view.set(id, entry)
      }
    } else {
      throw new Error('id not found: ' + id)
    }
  }

  get (id = undefined) {
    if (!id) {
      return [...this._view]
    } else {
      if (!this._view.has(id)) {
        return false
      } else {
        return this._view.get(id)
      }
    }
  }
}
