const EventEmitter = require('events')
const lmerge = require('lodash.merge')
const uniqid = require('uuid/v4')
const debug = require('debug')
const debugManager = debug('spa')

const DEFAULT_OPTIONS = () => {
  return {
    id: uniqid(),
    initiator: false,
    channelConfig: {},
    channelName: uniqid(),
    config: { iceServers: [ { urls: 'stun:stun.l.google.com:19302' } ] },
    constraints: {},
    offerConstraints: {},
    answerConstraints: {},
    reconnectTimer: false,
    sdpTransform: function (sdp) { return sdp },
    stream: false,
    streams: [],
    trickle: true,
    wrtc: {}, // RTCPeerConnection/RTCSessionDescription/RTCIceCandidate
    objectMode: false
  }
}

class Manager {
  constructor () {
    this._statistics = {
      message: 0
    }
    this.manager = new Map()
    this._options = {
      latency: (send) => { setTimeout(send, 0) }
    }
    debugManager('manager initialized')
  }
  get stats () {
    return this._statistics
  }

  newPeer (peer) {
    debugManager('new peer added. Size:', this.manager.size)
    this.manager.set(peer.id, peer)
  }

  connect (from, to) {
    debugManager('peer connected from/to: ', from, to)
    this.manager.get(to)._connectWith(from)
    this.manager.get(from)._connectWith(to)
  }

  destroy (from, to) {
    debugManager('peer disconnected from/to: ', from, to)
    if (this.manager.get(from)) {
      this.manager.get(from)._close()
      this.manager.delete(from)
    }
    if (this.manager.get(to)) {
      this.manager.get(to)._close()
      this.manager.delete(to)
    }
  }

  send (from, to, msg, retry = 0) {
    // this._options.latency(() => {
    this._send(from, to, msg, retry)
    // })
  }

  _send (from, to, msg, retry = 0) {
    try {
      if (!this.manager.has(from) || !this.manager.has(to)) throw new Error('need a from and to peer.')
      this.manager.get(to).emit('data', msg)
      this._statistics.message++
    } catch (e) {
      throw new Error('cannot send the message. perhaps your destination is not reachable.', e)
    }
  }
}
const manager = new Manager()

module.exports = class SimplePeerAbstract extends EventEmitter {
  constructor (options) {
    super()
    this._manager = manager
    this._options = lmerge(DEFAULT_OPTIONS(), options)
    this.id = this._options.id
    this.WEBRTC_SUPPORT = true // yes but this a fake
    this._isNegotiating = false
    this.connected = false
    this.disconnected = false
    this.connectedWith = undefined
    this.messageBuffer = []
    debugManager('peer initiated:', this.id, this._options.initiator)
    if (this._options.initiator) {
      // workaround to wait for a listener on 'signal'
      process.nextTick(() => {
        this._init()
      })
    }
    this._manager.newPeer(this)
  }

  static get manager () {
    return manager
  }

  send (data) {
    if (!this.connectedWith) {
      this.messageBuffer.push(data)
    } else {
      if (this.messageBuffer.length > 0) {
        this._reviewMessageBuffer()
      }
      if (this.connectedWith) {
        this._send(this.connectedWith, data)
      } else {
        this.messageBuffer.push(data)
      }
    }
  }

  destroy () {
    this._manager.destroy(this.id, this.connectedWith)
  }

  signal (data) {
    if (data.type === 'init') {
      this._isNegotiating = true
      debugManager('offer-init received:', data)
      this.emit('signal', this._createAccept(data))
    } else if (data.type === 'accept') {
      debugManager('offer-accept received:', data)
      this._connect(data)
    }
  }

  _error (error) {
    debugManager(error)
    this.emit('error', error)
  }

  _close () {
    debugManager('[%s] is closed.', this.id)
    this.emit('close')
  }

  _init () {
    this._isNegotiating = true
    const offer = this._createOffer()
    this.emit('signal', offer)
  }

  _createOffer () {
    const newOffer = {
      offerId: uniqid(),
      type: 'init',
      offer: {
        initiator: this.id
      }
    }
    return newOffer
  }
  _createAccept (offer) {
    const acceptedOffer = this._createOffer()
    acceptedOffer.type = 'accept'
    acceptedOffer.offerId = offer.offerId
    acceptedOffer.offer.initiator = offer.offer.initiator
    acceptedOffer.offer.acceptor = this.id
    return acceptedOffer
  }

  _reviewMessageBuffer () {
    debugManager('Review the buffer: ', this.messageBuffer.length)
    while (this.connectedWith && this.messageBuffer.length !== 0) {
      this._send(this.messageBuffer.pop())
    }
  }

  _send (to = this.connectedWith, data) {
    if (!to) throw new Error('It must have a destination.')
    this._manager.send(this.id, to, data)
  }

  _connect (offer) {
    if (!offer.offer.acceptor) throw new Error('It must have an acceptor')
    this._manager.connect(offer.offer.initiator, offer.offer.acceptor)
  }

  _connectWith (connectedWith) {
    this.connected = true
    this._isNegotiating = false
    this.connectedWith = connectedWith
    this.emit('connect')
  }
}
