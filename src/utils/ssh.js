'use strict'
/* eslint no-eval: 0 */
const EventEmitter = require('events')
const lmerge = require('lodash.merge')
const io = require('socket.io-client')

class SshControl extends EventEmitter {
  constructor (options = {}) {
    super()
    this.options = lmerge({
      foglet: undefined,
      address: 'http://localhost:4000/',
      verbose: true,
      origins: '*'
    }, options)

    this.signaling = io.connect(this.options.address, {origins: options.origins})

    this.signaling.emit('join', {
      id: this.options.foglet.id
    })

    this.signaling.on('remoteCommand', (command) => {
      let parsed
      this.log('remoteCommand', command)
      try {
        parsed = eval('(' + command + ')')
        this.log(parsed)
        this.deserialize(parsed.command)(this.options.foglet)
      } catch (e) {
        this.log(e)
      }
    })
  }

  deserialize (message) {
    return eval('(' + message + ')')
  }

  log (signal, message) {
    if (this.options.verbose && signal !== undefined && message !== undefined) {
      this.emit('logs', signal, message)
    }
  }
}

module.exports = SshControl
