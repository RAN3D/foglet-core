const short = require('short-uuid')
const translator = short()
const uuid = () => translator.new()

module.exports = {
  network: {
    spray: {
      delta: 30 * 1000,
      a: 1,
      b: 5,
      timeout: 10 * 1000
    },
    n2n: {
      id: uuid()
    },
    signaling: {
      room: 'default',
      port: 5555,
      host: 'http://localhost'
    },
    socket: {
      trickle: true,
      config: {
        iceServers: []
      },
      timeout: 10 * 1000,
      moc: false
    }
  },
  general: {
    maxListeners: 50
  }
}
