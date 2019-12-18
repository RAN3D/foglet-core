const Layer = require('../abstracts/layer')
const Utils = require('../utils')
const uuid = require('uuid/v4')
const debug = require('debug')('foglet-core:local')
const EventEmitter = require('events')

const neighborhood = new Map()
const signaling = {
  participants: new Map(),
  /**
   * The join method just return the identifier of the peer you will be connected with. Return undefined if you are alone, otherwise a random id if you are not connected yet
   * @return {Promise} resolve with the identifier | undefined if you are alone
   */
  join: async (from, peer) => {
    if (signaling.participants.size === 0) {
      signaling.participants.set(from, peer)
      neighborhood.set(from, [])
      return Promise.resolve(undefined)
    } else {
      if (!signaling.participants.has(from)) {
        const rn = Utils.pickRandom([...signaling.participants.keys()], [])
        signaling.participants.set(from, peer)
        return Promise.resolve(rn)
      } else {
        return Promise.reject(new Error('Already connected'))
      }
    }
  },
  /**
   * Send an offer through a third party signaling mechanism to the specified peer.
   * @param  {string}  from
   * @param  {string}  to
   * @return {Promise}      [description]
   */
  forward: async (from, to, event, offer) => {
    debug('signaling: forward offer from %s to %s : ', from, to, event, offer)
    if (signaling.participants.has(to)) {
      signaling.participants.get(to)._signalingListener.emit(event, from, to, offer)
    } else {
      throw new Error('destination not found:' + to)
    }
  },
  events: new EventEmitter()
}

module.exports = class LocalLayer extends Layer {
  constructor (...args) {
    super(...args)
    this._nameClass = 'LocalLayer'
    this._queue = []
    this._signalingListener = new EventEmitter()
    this._signalingListener.on('forward', (from, to, event, offer) => {
      debug('[%s][listener] receive event forward with ', from, to, offer)
      // when we create an offer, forward it to the signaling mechanism
      signaling.forward(from, to, event, offer).catch(e => {
        console.error(e)
      })
    })
    this._signalingListener.on('new', (from, to, offer) => {
      debug('[%s][listener] receive event new with ', from, to, offer)
      // when the signaling mechanism send us an offer, process it
      this._acceptOffer(from, to, offer).catch(e => {
        console.error(e)
      })
    })
    this._signalingListener.on('accept', (from, to, offer) => {
      debug('[%s][listener] receive event accept with ', from, to, offer)
      this._signalingListener.emit(offer.tid + '-accept', from, to, offer)
    })
    debug('Layer %s initialized', this.name)
  }

  /**
   * Return true if the connection already exsist or not.
   * @param  {string}  id identifier to check the connection with
   * @return {Boolean}
   */
  has (id) {
    return signaling.participants.has(this.id) && signaling.participants.has(id) && neighborhood.has(this.id) && neighborhood.get(this.id).includes(id)
  }

  async connect (id, options = {}) {
    if (!id) {
      const newPeer = await signaling.join(this.id, this)
      if (newPeer) {
        const tid = await this._createOffer(newPeer)
        return new Promise((resolve, reject) => {
          this._signalingListener.on(tid + '-error', (peer, offer) => {
            reject(new Error('connection rejected by ' + peer))
          })
          this._signalingListener.on(tid + '-connected', (peer) => {
            if (neighborhood.has(this.id)) {
              neighborhood.set(this.id, [...neighborhood.get(this.id), peer])
            } else {
              neighborhood.set(this.id, [peer])
            }
            resolve(peer)
          })
          this._signalingListener.on(tid + '-accept', (from, to, offer) => {
            this._finalizeOffer(from, offer)
          })
        })
      } else {
        return Promise.resolve(undefined)
      }
    }
  }

  /**
   * Return informations about a new connection to the given peer (id)
   * This information will be sent to the this peer through a third party tool
   * (if webrtc, a signaling server) if http or others you can skip this step.
   * @param  {string}  id the identifier of the new we will create the connection
   * @return {Promise} resolved with an offer, object information about the new connection
   */
  async _createOffer (id) {
    debug('[%s] creating an offer for %s...', this.id, id)
    const tid = uuid()
    const offer = {
      tid,
      from: this.id,
      to: id,
      protocol: 'local',
      description: 'new offer'
    }
    // put the emit on the next satck of events to create an trully asynchronous call
    setTimeout(() => {
      this._signalingListener.emit('forward', this.id, id, 'new', offer)
    }, 0)
    return tid
  }

  /**
   * Accept the new connection and return this information through a third party tool (eg if webrtc, a signaling server, HTTP or others, you can skip this step
   * @param  {string}  from identifier of the peer who want to connect to us
   * @param {*} offer the offer to accept
   * @return {Promise} Resolve with an accepted offer with information about the acceptance.
   */
  async _acceptOffer (from, to, offer = {}) {
    debug('[%s] accepting an offer from: %s', this.id, from, offer)
    const accept = {
      tid: offer.tid,
      from: offer.from,
      to: offer.to,
      protocol: 'local',
      description: 'accepted offer'
    }
    // just invert from with to to reply
    this._signalingListener.emit('forward', to, from, 'accept', accept)
    return accept.tid
  }

  /**
   * After the offer has been accepted by the remote peer, this one replies with an accepted offer
   * @param  {string}  id
   * @param  {*}  offer
   * @return {Promise} resolve when the newly created offer has been created reject otherwise
   */
  async _finalizeOffer (id, offer) {
    debug('[%s] receive an accepted offer from %s: ', this.id, id, offer)
    if (offer.description === 'accepted offer') {
      this._signalingListener.emit(offer.tid + '-connected', id)
    } else {
      this._signalingListener.emit(offer.tid + '-error', id, offer)
    }
  }

  /**
   * Send data to the destination id
   * @param  {string} id
   * @param  {*} data
   * @param  {*} options If reply is set to true, it means that this message is a reply message. So if the peer is not in the outview of this peer. It is in the inview.
   * @return {Promise}
   */
  async send (id, data, options = { reply: false }) {
    try {
      if (options.reply) {
        signaling.participants.get(id).receive(this.id, data)
      } else {
        if (neighborhood.get(this.id).includes(id)) {
          signaling.participants.get(id).receive(this.id, data)
        } else {
          throw new Error('local layer: peer not found' + id)
        }
      }
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  receive (id, data, options) {
    this._receiveCallback(id, data, options)
  }

  async disconnect (id) {
    if (!id) {
      signaling.participants.clear()
      neighborhood.clear()
    }
  }
}
