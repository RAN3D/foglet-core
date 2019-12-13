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

  add (id, layer = undefined) {
    if (!this._view.has(id)) {
      if (!layer) {
        throw new Error('no layer provided and the peer does not exists yet')
      }
      this._view.set(id, {
        layers: [layer],
        occ: 1
      })
      this.events.emit('add:physical', id)
    } else {
      const entry = this._view.get(id)
      if (entry.layers.includes(layer)) {
        throw new Error('layer provided, but the peer already have this layer. Not allowed.')
      } else if (layer === undefined) {
        entry.occ++
        this._view.set(id, entry)
        this.events.emit('add:virtual', id)
      } else {
        entry.layers.push(layer)
        this._view.set(id, entry)
      }
    }
  }

  remove (id, layer = undefined) {
    if (this._view.has(id)) {
      const entry = this._view.get(id)
      if (layer === undefined) {
        entry.occ--
        if (entry.occ === 0) {
          console.log('occurence is zero; delete the physical connection for all alyers')
          entry.layers.forEach((layer, identifier) => {
            layer.disconnect(identifier)
          })
          this._view.delete(id)
          this.events.emit('remove:physical', id)
        } else {
          this._view.set(id, entry)
        }
      } else {
        const layerIndex = entry.layers.find(l => l.name === layer.name)
        if (layerIndex > -1) {
          entry.layers.splice(layerIndex, 1)
          this.events.emit('remove:virtual', id)
        } else {
          throw new Error('layer not found during suppression.')
        }
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
