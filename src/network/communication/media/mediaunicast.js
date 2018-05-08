const CommunicationProtocol = require('../abstract/communication-protocol')
const debug = (require('debug'))('foglet-core:mediaunicast')

class MediaUnicast extends CommunicationProtocol {
  constructor(source, protocol) {
    super(source, `foglet-media-unicast-protocol-${protocol}`)
    this.options = {
      retry: 5
    }
    this.NI = this._source.rps.NI
    this.NO = this._source.rps.NO
    this.i = this._source.rps.i
    this.o = this._source.rps.o
    this._source.rps.on('stream', (id, stream) => {
      this._receive(id, stream)
    })
  }

  get pid() {
    return this._source.rps._pid()
  }

  /**
   * Send a message
   * @param {Object} id - The id to send the stream (media) to
   * @param  {Object}  media  - The stream to send
   * @return {boolean}
   */
  send (id, media) {
    return this._send(id, media, this.options.retry)
  }

  _send (peerId, media, retry = 0) {
      let promise
      // #1 normal behavior
      if (this.i.has(peerId)) {
          promise = this._sendBis(this.pid, peerId, media, retry, this.NI)
      } else if (this.o.has(peerId)) {
          promise = this._sendBis(this.pid, peerId, media, retry, this.NO)
      } else {
          // #2 last chance behavior
          promise = new Promise( (resolve, reject) => {
            const _send = (r) => {
              this._sendBis(this.pid, peerId, media, retry, this.NO).then( () => {
                resolve()
              }).catch( (e) => {
                this._sendBis(this.pid, peerId, media, retry, this.NI).then( () => {
                  resolve()
                }).catch( (e) => {
                  if (r<retry){
                    setTimeout( () => {
                        _send (r+1)
                    }, 1000);
                  } else {
                    reject(e)
                  }
                })
              })
            }
            _send(0)
          });
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
          console.log('sending:', entry.socket, media)
          entry.socket.addStream(media)
          debug('[%s][%s] --- MEDIA msg --> %s:%s',protocolId, Neighbor.PEER, peerId, protocolId)
          resolve()
        } catch (e) {
          debug('[%s][%s] -X- MEDIA msg -X> %s:%s',protocolId, Neighbor.PEER, peerId, protocolId)
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
    this.emit('receive', id, stream)
  }
}

module.exports = MediaUnicast
