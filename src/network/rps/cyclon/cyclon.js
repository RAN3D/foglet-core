const N2N = require('n2n-overlay-wrtc')
const lmerge = require('lodash.merge')
const uniqid = require('uuid/v4')
const PV = require('./partialview')
const debug = (require('debug'))('cyclon')

/**
 * Implementation of CYCLON: Inexpensive Membership Management for Unstructured P2P Overlays
 * Spyros Voulgaris,1,2 Daniela Gavidia,1 and Maarten van Steen1
 * @article{voulgaris2005cyclon,
    title={Cyclon: Inexpensive membership management for unstructured p2p overlays},
    author={Voulgaris, Spyros and Gavidia, Daniela and Van Steen, Maarten},
    journal={Journal of Network and Systems Management},
    volume={13},
    number={2},
    pages={197--217},
    year={2005},
    publisher={Springer}
  }
 *
 * @type {[type]}
 */
module.exports = class Cyclon extends N2N {
  constructor (options) {
    const DEFAULT_OPTIONS = {
      pid: 'cyclon',
      peer: uniqid(),
      maxPeers: 5,
      timeoutnetwork: 20 * 1000,
      timeoutconnection: 20 * 1000,
      retry: 5,
      delta: 30 * 1000,
      timeout: 30 * 1000
    }
    super(lmerge(DEFAULT_OPTIONS, options))
    this._partialView = new PV()
    this._periodic = undefined
    this.on('receive', (id, msg) => this._receive(id, msg))
    this.on('open', (peerId) => {
      this._open(peerId)
    })
    this.on('close', (peerId) => {
      this._close(peerId)
    })
    this.on('fail', (peerId) => {
      this._onArcDown(peerId)
    })
  }

  get partialView () {
    return this._partialView
  }

  /**
   * Joining a network.
   * @param {callback} sender Function that will be called each time an offer
   * arrives to this peer. It is the responsability of the caller to send
   * these offer (using sender) to the contact inside the network.
   * @returns {Promise} A promise that is resolved when the peer joins the
   * network -- the resolve contains the peerId; rejected after a timeout, or
   * already connected state.
   */
  join (sender) {
    return new Promise((resolve, reject) => {
      let to = setTimeout(() => {
        reject(new Error('conenction timed out'))
      }, this.options.timeoutconnection)
      // #2 very first call, only done once
      this.once('open', (peerId) => {
        this.send(peerId, {type: 'MJoin'}, this.options.retry).then(() => {
          clearTimeout(to)
          this._start() // start shuffling process
          resolve(peerId)
        }).catch(() => {
          reject(new Error('failed to send a MJoin message after establishing the connection. Please report.'))
        })
      })
      this.connect(sender)
    })
  }

  _open (peerId) {
    debug('[%s] %s ===> %s', this.PID, this.PEER, peerId)
    if (!this._partialView.has(peerId)) this._partialView.add(peerId)
    if (this._partialView.size > this.options.maxPeers) {
      this.disconnect(peerId)
    }
  }

  /**
   * @private Behavior when a connection is closed.
   * @param {string} peerId The identifier of the removed arc.
   */
  _close (peerId) {
    debug('[%s] %s =†=> %s', this.PID, this.PEER, peerId)
    if (this._partialView.has(peerId)) this._partialView.delete(peerId)
  }

  _onJoin (id) {
    if (this._partialView.size > 0) {
      // #1 all neighbors -> peerId
      debug('[%s] %s ===> join %s ===> %s neighbors', this.PID, id, this.PEER, this._partialView.size)
      this._partialView.forEach((ages, neighbor) => {
        this.connect(id, neighbor)
      })
    } else {
      // #2 Seems like a 2-peer network;  this -> peerId;
      debug('[%s] %s ===> join %s ===> %s', this.PID, id, this.PEER, id)
      this.connect(null, id)
    };
  }

  _onLeave (id) {
    debug('%s: just left the game!', id)
  }

  _start () {
    debug('[%s] starting periodic shuffling with period=%f', this.PEER, this.options.delta)
    this._periodic = setInterval(() => {
      this.exchange()
    }, this.options.delta)
  }

  _stop () {
    clearInterval(this._periodic)
  }

  /**
   * @private Called each time this protocol receives a message.
   * @param {string} peerId The identifier of the peer that sent the message.
   * @param {object|MExchange|MJoin} message The message received.
   */
  _receive (peerId, message) {
    if (message.type && message.type === 'MExchange') {
      this._onExchange(peerId, message)
    } else if (message.type && message.type === 'MExchangeBack') {
      this.emit('MExchangeBack-' + message.id, peerId, message)
    } else if (message.type && message.type === 'MJoin') {
      this._onJoin(peerId)
    } else if (message.type && message.type === 'MLeave') {
      this._onLeave(peerId)
    } else if (message.type && message.type === 'MBridge') {
      this._onBridge(message.from, message.to)
    } else {
      throw new Error('_receive, message unhandled')
    }
  }

  _exchange () {
    return this.exchange()
  }

  exchange () {
    this.emit('begin-shuffle')
    return new Promise((resolve, reject) => {
      if (this._partialView.size === 0) resolve()

      // 1. Increase by one the age of all neighbors.
      this._partialView.increment()
      // 2. Select neighbor Q with the highest age among all neighbors, and l − 1
      // other random neighbors.
      // const keys = [...this._partialView.keys()]
      const oldest = this._partialView.oldest // keys[Math.floor(Math.random() * keys.length)]
      const sample = this._getSample(this.options.maxPeers)
      // 3. Replace Q’s entry with a new entry of age 0 and with P’s address.
      this._partialView.removeOldest(oldest)
      this._partialView.add(oldest)
      sample.map(samp => {
        if (samp.id === oldest) {
          samp.id = this.getInviewId()
          samp.age = 0
        }
      })
      debug('[%s] Starting to exchange with %s with a sample of size: %f', this.PEER, oldest, sample.length)
      // 4. Send the updated subset to peer Q.
      // need to try with another peer if it fails
      const msgid = uniqid()
      this.send(oldest, {
        type: 'MExchange',
        id: msgid,
        from: this.getInviewId(),
        sample
      }, this.options.retry).then(() => {
        // put a timeout on the reply in order to skip the round
        let timeout = setTimeout(() => {
          this.removeAllListeners('MExchangeBack-' + msgid)
          resolve() // skip the round or perhaps reject?
        }, this.options.timeoutnetwork)
        // 5. Receive from Q a subset of no more that i of its own entries
        this.once('MExchangeBack-' + msgid, (id, message) => {
          clearTimeout(timeout)
          // 6. Discard entries pointing at P and entries already contained in P’s
          // cache.
          // at least put the id of the peer we just exchange samples into the list of arcs to remove
          const tokeep = message.sample.filter(samp => {
            if (this._partialView.has(samp.id) || samp.id === oldest || samp.id === id) {
              return false
            } else {
              return true
            }
          })
          // 7. Update P’s cache to include all remaining entries, by firstly using empty
          // cache slots (if any), and secondly replacing entries among the ones sent to Q.
          for (let i = 0; i < tokeep.length; i++) {
            const keep = tokeep[i]
            if (this._partialView.size >= this.options.maxPeers) {
              const rn = Math.floor(Math.random() * sample.length)
              const idrn = sample[rn].id
              sample.splice(rn, 1)
              debug('[%s] replacing entry %s by %s', this.PEER, idrn, keep.id)
              this.disconnect(idrn)
              this._partialView.removeAll(idrn)
            }
            this.send(id, {
              type: 'MBridge',
              from: this.getInviewId(),
              to: keep.id
            }, this.options.retry).then(() => {
              //
            }).catch(e => {
              // console.log(e)
            })
          }
          resolve()
        })
      }).catch(e => {
        console.log('%s Error when sending the sample to %s', this.PEER, oldest)
        // try with another peers or skip
        resolve()
      })
    }).then(() => {
      this.emit('end-shuffle')
      return Promise.resolve()
    }).catch(e => {
      this.emit('end-shuffle')
      return Promise.reject(e)
    })
  }

  _onExchange (id, message) {
    // the receiving node Q replies by sending back a random subset of at most l of its neighbors,
    //  and updates its own cache to accommodate all received entries.
    //  It does not increase, though, any entry’s age until its own turn comes to initiate a shuffle.
    const saveSample = message.sample.slice(0)
    const saveOriginator = String(message.from)
    const sample = this._getSample(this.options.maxPeers)
    debug('[%s] Answer to a an exchange demande with %s with a sample of size: %f', this.PEER, saveOriginator, sample.length)
    // now reply
    message.type = 'MExchangeBack'
    message.sample = sample
    message.from = this.getInviewId()
    this.send(id, message, this.options.retry)
    // 6. Discard entries pointing at P and entries already contained in P’s
    // cache.
    const tokeep = saveSample.filter(samp => {
      if (this._partialView.has(samp.id)) {
        return false
      } else {
        return true
      }
    })
    // 7. Update P’s cache to include all remaining entries, by firstly using empty
    // cache slots (if any), and secondly replacing entries among the ones sent to Q.
    for (let i = 0; i < tokeep.length; i++) {
      const keep = tokeep[i]
      if (this._partialView.size >= this.options.maxPeers) {
        // replacement of links into our pv...
        const rn = Math.floor(Math.random() * sample.length)
        const idrn = sample[rn].id
        sample.splice(rn, 1)
        debug('[%s] replacing entry %s by %s', this.PEER, idrn, keep.id)
        this.disconnect(idrn)
        this._partialView.removeAll(idrn)
      }
      this.send(id, {
        type: 'MBridge',
        from: this.getInviewId(),
        to: keep.id
      }, this.options.retry).then(() => {
        //
      }).catch(e => {
        // console.log(e)
      })
    }
  }

  _getSample (size) {
    let sample = []
    // #1 create a flatten version of the partial view
    let flatten = []
    this._partialView.forEach((ages, neighbor) => {
      flatten.push({id: neighbor, age: ages[0]})
    })
    // #2 process the size of the sample, at maximum maxPeers
    const sampleSize = Math.min(flatten.length, size)
    // #3 add neighbors to the sample chosen at random
    while (sample.length < sampleSize) {
      const rn = Math.floor(Math.random() * flatten.length)
      sample.push(flatten[rn])
      flatten.splice(rn, 1)
    };
    return sample
  }

  /**
   * Get k neighbors from the partial view. If k is not reached, it tries to
   * fill the gap with neighbors from the inview.  It is worth noting that
   * each peer controls its outview but not its inview. The more the neigbhors
   * from the outview the better.
   * @param {number} k The number of neighbors requested. If k is not defined,
   * it returns every known identifiers of the partial view.
   * @return {string[]} Array of identifiers.
   */
  getPeers (k) {
    let peers = []
    if (typeof k === 'undefined') {
      // #1 get all the partial view
      this._partialView.forEach((occ, peerId) => {
        peers.push(peerId)
      })
    } else {
      // #2 get random identifier from outview
      let out = []
      this._partialView.forEach((ages, peerId) => out.push(peerId))
      while (peers.length < k && out.length > 0) {
        let rn = Math.floor(Math.random() * out.length)
        peers.push(out[rn])
        out.splice(rn, 1)
      };
      // #3 get random identifier from the inview to fill k-entries
      let inView = []
      this.i.forEach((occ, peerId) => inView.push(peerId))
      while (peers.length < k && inView.length > 0) {
        let rn = Math.floor(Math.random() * inView.length)
        peers.push(inView[rn])
        inView.splice(rn, 1)
      };
    };
    // debug('[%s] %s provides %s peers', this.PID, this.PEER, peers.length)
    return peers
  }

  _onBridge (from, to) {
    // debug('[%s] Bridge bewteen (%s,%s)', this.PEER, from, to)
    if (from !== to) this.connect(from, to)
  }

  /**
   * @private A connection failed to establish properly, systematically
   * duplicates an element of the partial view.
   * @param {string|null} peerId The identifier of the peer we failed to
   * establish a connection with. Null if it was yet to be known.
   */
  _onArcDown (peerId) {
    debug('[%s] ONARCDOWN ==> %s =X> %s', this.PID, this.PEER, peerId || 'unknown')
  }
}
