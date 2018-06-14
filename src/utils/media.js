const CommunicationProtocol = require('../network/communication/abstract/communication-protocol')
const Communication = require('../network/communication/communication')
const debug = (require('debug'))('foglet-core:media')
const uuid = require('uuid/v4')
const lmerge = require('lodash.merge')
const MediaRecorderStream = require('media-recorder-stream')
const MediaSource = require('mediasource')
const Stream = require('stream')

class ReadableFromStream extends Stream.Readable {
  constructor (source, parent, options) {
    super(options)
    this.source = source
    this.parent = parent
    this.objectMode = true
    this.count = 0
    let stack = ''
    this.source.on('data', (data) => {
      if (this.count === 0) {
        if (!this.parent._activeStream.has(data.id)) {
          this.parent._activeStream.set(data.id, {source: this, options: data})
        }
        this.parent.emit('receive', data.id)
        this.count++
      } else {
        if (data.type === 'full') {
          this.push(data.payload)
          this.count++
        } else if (data.type === 'end') {
          stack += data.payload
          this.push(new Uint8Array(JSON.parse(stack).data))
          this.count++
          stack = ''
        } else {
          stack += data.payload
        }
      }
    })
    this.source.on('end', () => {
      this.end()
    })
  }

  _read (size) {}
}

/**
 * Media Stream Manager
 * If using Video/audio stream for all users: use the broadcast primitive (Data Channel)
 * If using Video/audio stream for only one user, use the unicast primitive (Streaming)
 * But pay attention that using unicast method, when a shuffling occur the connection might diseapear.
 * For this usage, create an overlay network with only this peer connected to you.
 * Or shut down the shuffle mechanism but this is not recommended.
 * @extends CommunicationProtocol
 */
class Media extends CommunicationProtocol {
  constructor (source, protocol, options) {
    super(source, `foglet-media-internal-${protocol}`)
    this.options = {
      retry: 1,
      chunkSize: 56 * 1024 // pay attention to the maximum, or it will not work.
    }
    this._activeMedia = new Map()
    this._activeStream = new Map()
    this._communication = new Communication(source, `foglet-media-internal-${protocol}`)

    this.NI = this._source.rps.NI
    this.NO = this._source.rps.NO

    this.i = this._source.rps.i
    this.o = this._source.rps.o
    this._source.rps.on('stream', (id, stream) => {
      this._receive(id, stream)
    })

    this._communication.onStreamBroadcast((id, stream) => {
      debug('Receive a media stream: ', id, stream)
      this._reconstruct(stream)
    })
  }

  get pid () {
    return this._source.rps._pid()
  }

  /**
   * Send a message to only one neighbor...
   * @param {Object} id - The id to send the stream (media) to
   * @param  {Object}  media  - The stream to send
   * @return {boolean}
   */
  sendUnicast (id, media) {
    if (!media.id) media.id = uuid()
    if (!this._activeMedia.has(media.id)) {
      this._activeMedia.set(media.id, media)
      this._setListeners(media)
    }
    return this._send(id, media, this.options.retry)
  }

  /**
   * Send a MediaStream using our broadcast primitives using Data Channel.
   * @param {Object} id - The id to send the stream (media) to
   * @param  {Object}  media  - The stream to send
   * @return {boolean}
   */
  sendBroadcast (media, options = {}) {
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/MediaRecorder
    options = lmerge({
      mimeType: 'video/webm; codecs="vp8"', // You MUST set the MIME type
      interval: 100, // A short interval is recommended to keep buffer sizes low
      bitsPerSecond: 128 * 1024
    }, options)

    if (!media.id) media.id = uuid()
    if (!this._activeMedia.has(media.id)) {
      this._activeMedia.set(media.id, media)
      this._setListeners(media)
    }
    const ms = new MediaRecorderStream(media, options)
    const stream = this._communication.streamBroadcast()
    options.id = media.id
    stream.write(options)
    ms.on('data', (data) => {
      const chunkified = this.chunkify(JSON.stringify(data))
      if (chunkified.length === 0) {
        stream.write({
          type: 'full',
          id: 0,
          payload: chunkified[0]
        })
      } else {
        for (let i = 0; i < chunkified.length; i++) {
          if (i === chunkified.length - 1) {
            stream.write({
              type: 'end',
              id: i,
              payload: chunkified[i]
            })
          } else {
            stream.write({
              type: 'chunk',
              id: i,
              payload: chunkified[i]
            })
          }
        }
      }
    })
    ms.on('end', () => {
      stream.end()
    })
  }

  _reconstruct (stream, options = null) {
    const readable = new ReadableFromStream(stream, this)
    readable.on('error', (err) => {
      console.error(err)
    })
  }

  getStreamMedia (id, elem) {
    if (!this._activeStream.has(id)) return undefined
    const wrapper = new MediaSource(elem)
    const writable = wrapper.createWriteStream(this._activeStream.get(id).options.mimeType)
    elem.addEventListener('error', function () {
      // listen for errors on the video/audio element directly
      var errorCode = elem.error
      var detailedError = wrapper.detailedError
      console.error(errorCode, detailedError)
      // wrapper.detailedError will often have a more detailed error message
    })

    writable.on('error', function (err) {
      // listening to the stream 'error' event is optional
      console.error(err)
    })
    this._activeStream.get(id).source.pipe(writable)
  }

  _send (peerId, media, retry = this.options.retry) {
    let promise
    // #1 normal behavior
    if (this.i.has(peerId)) {
      promise = this._sendBis(this.pid, peerId, media, retry, this.NI)
    } else if (this.o.has(peerId)) {
      promise = this._sendBis(this.pid, peerId, media, retry, this.NO)
    } else {
      // #2 last chance behavior
      promise = new Promise((resolve, reject) => {
        const _send = (r) => {
          this._sendBis(this.pid, peerId, media, retry, this.NO).then(() => {
            resolve()
          }).catch((e) => {
            this._sendBis(this.pid, peerId, media, retry, this.NI).then(() => {
              resolve()
            }).catch((e) => {
              if (r < retry) {
                setTimeout(() => {
                  _send(r + 1)
                }, 1000)
              } else {
                reject(e)
              }
            })
          })
        }
        _send(0)
      })
    };
    return promise
  }

  _sendBis (protocolId, peerId, media, retry = 0, Neighbor) {
    return new Promise((resolve, reject) => {
      // #1 get the proper entry in the tables
      let entry = null
      if (Neighbor.living.contains(peerId)) {
        entry = Neighbor.living.get(peerId)
      } else if (Neighbor.dying.has(peerId)) {
        entry = Neighbor.dying.get(peerId) // (TODO) warn: not safe
      };

      // #2 define the recursive sending function
      let __send = (r) => {
        try {
          entry.socket.addStream(media)
          debug('[%s][%s] --- MEDIA msg --> %s:%s', protocolId, Neighbor.PEER, peerId, protocolId)
          resolve()
        } catch (e) {
          debug('[%s][%s] -X- MEDIA msg -X> %s:%s', protocolId, Neighbor.PEER, peerId, protocolId)
          if (r < retry) {
            setTimeout(() => { __send(r + 1) }, 1000)
          } else {
            reject(e)
          };
        };
      }
      // #3 start to send
      __send(0)
    })
  };

  /**
   * Handler executed when a message is recevied
   * @param  {string} id  - Message issuer's ID
   * @param  {Object} stream - The stream received
   * @return {void}
   */
  _receive (id, stream) {
    debug('Receive a media stream: ', id, stream)
    if (!stream.id) stream.id = uuid()
    if (!this._activeMedia.has(stream.id)) {
      this._activeMedia.set(stream.id, {peer: id, stream})
      this._setListeners(stream)
    }
    this.emit('receive', id, stream)
  }

  _setListeners (media) {
    media.onactive = () => {
      console.log('Media %s is active...', media.id)
    }
    media.oninactive = () => {
      console.log('Media %s is inactive... (Disconnection or a Shuffling occured.)', media.id)
      // this._sendRequest(media.id)
    }
    media.onended = () => {
      console.log('Media %s is finished...', media.id)
    }
  }

  /**
   * Chunk a string into n message of size 'chunkSize'
   * @param {string} string
   * @param {Number=this.options.chunkSize} chunkSize
   */
  chunkify (string, chunkSize = this.options.chunkSize) {
    // https://stackoverflow.com/questions/7033639/split-large-string-in-n-size-chunks-in-javascript
    return string.match(new RegExp('.{1,' + chunkSize + '}', 'g'))
  }
}

module.exports = Media
