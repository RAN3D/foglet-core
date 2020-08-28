const Layer = require('../abstracts/layer')
const LocalSignaling = require('../signalings/local-signaling')
const uuid = require('uuid/v4')
const debug = require('debug')('foglet-core:local')
const EventEmitter = require('events')

module.exports = class LocalLayer extends Layer {
  constructor (...args) {
    super(...args)
    this._nameClass = 'LocalLayer'
    /*
      Just in case we want to create different local layers then it is possible by changing the name, thus we will have different connections for different name
     */
    if (!LocalSignaling.protocols().has(this.name)) {
      LocalSignaling.protocols().set(this.name, new LocalSignaling())
    }

    this._events = new EventEmitter()
    this._events.on('forward', (from, to, event, offer) => {
      debug('[%s][listener] receive event forward with ', from, to, offer)
      // when we create an offer, forward it to the signaling mechanism
      this.signaling.forward(from, to, event, offer).catch(e => {
        console.error(e)
      })
    })
    this._events.on('new', (from, to, offer) => {
      debug('[%s][listener] receive event new with ', from, to, offer)
      // when the signaling mechanism send us an offer, process it
      this._acceptOffer(from, to, offer).catch(e => {
        console.error(e)
      })
    })
    this._events.on('accept', (from, to, offer) => {
      debug('[%s][listener] receive event accept with ', from, to, offer)
      this._events.emit(offer.tid + '-accept', from, to, offer)
    })
    debug('Layer %s initialized', this.name)
  }

  /**
   * @private
   */
  get neighborhood () {
    return LocalSignaling.protocols().get(this.name).neighborhood
  }

  /**
   * @private
   */
  get participants () {
    return LocalSignaling.protocols().get(this.name).participants
  }

  /**
   * @private
   */
  get signaling () {
    return LocalSignaling.protocols().get(this.name)
  }

  /**
   * Return true if the connection already exist or not.
   * @param  {string}  id identifier to check the connection with
   * @return {Boolean}
   */
  has (id) {
    return this.participants.has(this.id) && this.participants.has(id) && this.neighborhood.has(this.id) && this.neighborhood.get(this.id).includes(id)
  }

  async connect (id, options = { by: undefined }) {
    if (!id) {
      debug('[%s] first connection: ', this.id, options)
      // if otpions.by is provided, we will try to create the first connection to options.by instead of a random one if we are not alone
      const newPeer = await this.signaling.join(this.id, options.by, this)
      if (newPeer) {
        const tid = await this._createOffer(newPeer)
        return new Promise((resolve, reject) => {
          this._events.on(tid + '-error', (peer, offer) => {
            reject(new Error('connection rejected by ' + peer))
          })
          this._events.on(tid + '-connected', (peer) => {
            if (this.neighborhood.has(this.id)) {
              this.neighborhood.set(this.id, [...this.neighborhood.get(this.id), peer])
            } else {
              this.neighborhood.set(this.id, [peer])
            }
            resolve(peer)
          })
          this._events.on(tid + '-accept', (from, to, offer) => {
            this._finalizeOffer(from, offer)
          })
        })
      } else {
        return Promise.resolve(undefined)
      }
    } else {
      debug('[%s] direct connection to: %s by %s', this.id, id, options.by)
      // if the identifier is provided it means we need to create a connection between us and the peer. 4 options:
      // 1) the option.by is provided; and options.by !== id it means we will create the connection by sending offers through the 'by' identifier identifying a peer of our view. This by identifier might have the id in its own view. Otherwise reject with an error. Reject anyway if there is an error. Or resolve with the newly created connection
      // 2) if options.by === id, if id in our view, then we will create the connection from Id to us, if the connection does not already exist yet, otherwise reject
      // 3) options.by not set and id is in our view, reject because the connection already exist.
      // 4) options.by is not set and id is not in our view. Reject
      if (options.by !== undefined) {
        if (options.by !== id) {
          return new Promise((resolve, reject) => {
            this._createOffer(id, (us, id, event, offer) => {
              // option 1
              this.send(options.by, {
                type: this.name + '-internal-forward',
                from: us,
                to: id,
                by: options.by,
                event,
                offer
              }).catch(e => {
                reject(e)
              })
            }).then(tid => {
              // first create the offer
              this._events.on(tid + '-error', (peer, _) => {
                reject(new Error('connection rejected by ' + peer))
              })
              this._events.on(tid + '-connected', (peer) => {
                if (this.neighborhood.has(this.id)) {
                  this.neighborhood.set(this.id, [...this.neighborhood.get(this.id), peer])
                } else {
                  this.neighborhood.set(this.id, [peer])
                }
                resolve(peer)
              })
              this._events.on(tid + '-accept', (from, _, offer) => {
                this._finalizeOffer(from, offer)
              })
            })
          })
        } else {
          // option 2, options.by === id
          return new Promise((resolve, reject) => {
            const tid = uuid()
            this.send(id, {
              type: this.name + '-internal-receive',
              event: 'direct-new',
              to: this.id,
              id: tid
            })
            this._events.once(tid, (peer) => {
              // console.log(tid)
              resolve(undefined)
            })
          })
        }
      } else {
        if (this.has(id)) {
          // option 3
          throw new Error('connection already exists')
        } else {
          // options 4
          throw new Error('cannot found the connection identifying: ' + id + ' and options.by is not set.')
        }
      }
    }
  }

  /**
   * Return informations about a new connection to the given peer (id)
   * This information will be sent to the this peer through a third party tool
   * @param  {string}  id the identifier of the new we will create the connection
   * @return {Promise} resolved with an offer, object information about the new connection
   */
  async _createOffer (id, cb = undefined) {
    debug('[%s] creating an offer for %s...', this.id, id)
    const tid = uuid()
    const offer = {
      tid,
      from: this.id,
      to: id,
      protocol: this.name,
      description: 'new offer'
    }
    // put the emit on the next stack of events to create a truly asynchronous call
    setTimeout(() => {
      if (cb === undefined) {
        cb = (us, id, event, offer) => {
          this._events.emit('forward', us, id, event, offer)
        }
      }
      cb(this.id, id, 'new', offer)
    }, 1)
    return tid
  }

  /**
   * Accept the new connection and return this information through a third party tool
   * @param  {string}  from identifier of the peer who want to connect to us
   * @param {*} offer the offer to accept
   * @return {Promise} Resolve with an accepted offer with information about the acceptance.
   */
  async _acceptOffer (from, to, offer = {}, cb = undefined) {
    debug('[%s] accepting an offer from: %s', this.id, from, offer)
    const accept = {
      tid: offer.tid,
      from: offer.from,
      to: offer.to,
      protocol: this.name,
      description: 'accepted offer'
    }
    // just invert from with to to reply
    if (cb === undefined) {
      cb = (from, to, event, offer) => {
        this._events.emit('forward', from, to, event, offer)
      }
    }
    cb(to, from, 'accept', accept)
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
      this._events.emit(offer.tid + '-connected', id)
    } else {
      this._events.emit(offer.tid + '-error', id, offer)
    }
  }

  /**
   * @private
   */
  async _processForwardConnection (id, data, options) {
    if (data.event === 'new') {
      this._acceptOffer(data.from, data.to, data.offer, (from, to, event, offer) => {
        data.type = this.name + '-internal-forward'
        data.to = data.from
        data.from = this.id
        data.event = event
        data.offer = offer
        // we might no have id in our view at this moment, so we need to check in the inview if so
        this.send(id, data, { reply: true }).catch(e => {
          console.error(e)
        })
      })
    }
  }

  /**
   * @private
   */
  async _processDirectConnection (id, data, options) {
    if (data.event === 'direct-new') {
      const tid = await this._createOffer(data.to, (from, to, event, offer) => {
        data.type = this.name + '-internal-receive'
        data.to = id
        data.from = this.id
        data.event = 'direct-accept'
        data.offer = offer
        // we might no have id in our view at this moment, so we need to check in the inview if so
        this.send(id, data, { reply: true }).catch(e => {
          console.error(e)
        })
      })
      this._events.on(tid + '-accept', (from, to, offer) => {
        this._finalizeOffer(from, offer)
      })
      this._events.on(tid + '-connected', (peer) => {
        if (this.neighborhood.has(this.id)) {
          this.neighborhood.set(this.id, [...this.neighborhood.get(this.id), peer])
        } else {
          this.neighborhood.set(this.id, [peer])
        }
        this.send(id, {
          type: this.name + '-internal-receive',
          id: data.id,
          to: id,
          event: 'emit',
          message: 'connected'
        }).then(() => {
          // in this case only emit the event add:physical on options.event.layer as we added a new physical connection with the help of a neighbour.
          this.options.events.layer.emit('add:physical', id)
        }).catch(e => {
          console.error(e)
        })
      })
    } else if (data.event === 'direct-accept') {
      this._acceptOffer(data.from, data.to, data.offer, (from, to, event, offer) => {
        data.type = this.name + '-internal-receive'
        data.to = data.from
        data.from = this.id
        data.event = event
        data.offer = offer
        // we might no have id in our view at this moment, so we need to check in the inview if so
        this.send(id, data, { reply: true }).catch(e => {
          console.error(e)
        })
      })
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
    debug('[%s] sending to %s: ', this.id, id, data, options)
    try {
      if (options.reply) {
        this.participants.get(id).receive(this.id, data)
      } else {
        if (this.neighborhood.get(this.id).includes(id)) {
          this.participants.get(id).receive(this.id, data)
        } else {
          throw new Error('[LocalLayer/send] peer not found: ' + id)
        }
      }
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  /**
   * When we receive a message fron a neighbor this method is called by the layer
   * @param  {string} id
   * @param  {*} data
   * @param  {*} options
   * @return {void}
   */
  receive (id, data, options) {
    debug('[%s] receving data from %s: ', this.id, id, data, options)
    try {
      if (data.type && data.type === this.name + '-internal-forward') {
        data.type = this.name + '-internal-receive'
        // the destination peer might not have this peer in its view, so set the reply to true
        this.send(data.to, data, { ...options, reply: true }).catch(e => {
          console.error(e)
        })
      } else if (data.type && data.type === this.name + '-internal-receive') {
        if (data.event === 'accept') {
          this._events.emit('accept', data.from, data.to, data.offer)
        } else if (data.event === 'emit') {
          // console.log(id, data, options)
          this._events.emit(data.id, data)
        } else {
          this._processForwardConnection(id, data, options).catch(e => {
            console.error(e)
          })
          this._processDirectConnection(id, data, options).catch(e => {
            console.error(e)
          })
        }
      } else {
        this._receiveCallback(id, data, options)
      }
    } catch (e) {
      console.error(e)
      this._receiveCallback(id, data, options)
    }
  }

  /**
   * Remove and clear a connection with a peer or all connections if id is not specified
   * @param  {string}  id identifier of the connection we want to remove
   * @return {Promise}
   */
  async disconnect (id) {
    if (!id) {
      this.participants.clear()
      this.neighborhood.clear()
    }
  }
}
