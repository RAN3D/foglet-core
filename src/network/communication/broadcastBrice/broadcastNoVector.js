/*
This broadcast implementation  is clearly inspired from https://github.com/Chat-Wane/CausalBroadcastDefinition
This is a broadcast customizable, if you want to specifiy
Ensure single delivery and causality between 2 consecutive messages from a single site
*/
'use strict'

const AbstractBroadcast = require('./../abstract/abstract-broadcast.js')
const VVwE = require('version-vector-with-exceptions') // Version-Vector With Exceptions
const messages = require('./messages.js')

const uuid = require('uuid/v4')
const sortedIndexBy = require('lodash.sortedindexby')
const debug = (require('debug'))('foglet-core:broadcast')

/**
 * Format the IDs of messages in string format
 * @param  {Obbject} message - The message to format
 * @return {string} The formatted message's id in string format
 */
function formatID (message) {
  return `e=${message.id.e}&c=${message.id.c}`
}

/**
 * Broadcast represent the base implementation of a broadcast protocol for the foglet library.
 * Based on the CausalBrodacastDefinition Package: see: https://github.com/Chat-Wane/CausalBroadcastDefinition
 * @extends AbstractBroadcast
 * @author Arnaud Grall (Folkvir)
 */
class BroadcastNoVector extends AbstractBroadcast {

  var bufferMessages = new Map();
  var messageId = new Map();
  var retries = new Map();
  var maxSize = Number.MAX_SAFE_INTEGER
  var maxRetry = Number.MAX_SAFE_INTEGER

  /**
   * Constructor
   * @param  {AbstractNetwork} source - The source RPS/overlay
   * @param  {string} protocol - The name of the broadcast protocol
   */
  constructor (source, protocol) {
    super(source, protocol)
    if (source && protocol) {
      this.options = {
        id: source.id,
        delta: 1000 * 30
      }
      // the id is your id, base on the .PEER id in the RPS options
      this._causality = new VVwE(this.options.id)
      // buffer of received messages
      this._buffer = []
      // buffer of anti-entropy messages (chunkified because of large size)
      this._bufferAntiEntropy = messages.MAntiEntropyResponse('init')
    } else {
      return new Error('Not enough parameters', 'fbroadcast.js')
    }
  }

  /**
   * Send a message in broadcast
   * @param  {Object}  message  - The message to send
   * @param  {Object} [id] {e: <stringId>, c: <Integer>} this uniquely represents the id of the operation
   * @param  {Object} [isReady] {e: <stringId>, c: <Integer>} this uniquely represents the id of the operation that we must wait before delivering the message
   * @return {boolean}
   */
  send (message, id, isReady = undefined, useIsReady = true) {
    const messageId = id || this._causality.increment()
    if (messageId.e !== this._causality.local.e) {
      throw new Error('The id of the identifier need to be equal to: ' + this._causality.local.e)
    } else if (messageId.c < this._causality.local.v) {
      throw new Error('Cant send the message because the identifier has a counter lower than our local counter: need to be equal to ' + this._causality.local.v + 1)
    } else if (messageId.c > this._causality.local.v + 1) {
      throw new Error('Cant send the message because the identifier has a counter higher than the counter accepted: need to be equal to ' + this._causality.local.v + 1)
    }
    let rdy = isReady
    if (useIsReady && !rdy) {
      // if the counter is higher than one, it means that we already send messages on the network
      if (messageId.c > 1) {
        rdy = {
          e: messageId.e,
          c: messageId.c - 1
        }
      }
    }
    const broadcastMessage = this._createBroadcastMessage(message, messageId, rdy)
    // #2 register the message in the structure
    this._causality.incrementFrom(messageId)
    // #3 send the message to the neighborhood
    this._sendAll(broadcastMessage)
    return messageId
  }

  /*
  _receive (id, message) {
    // if not present, add the issuer of the message in the message
    if (!('issuer' in message)) { message.issuer = id }

    switch (message.type) {
      case 'MAntiEntropyRequest': {
        debug(id, message)
        this.emit('antiEntropy', id, message.causality, this._causality.clone())
        break
      }
      case 'MAntiEntropyResponse': {
      // #A replace the buffered message
        if (this._bufferAntiEntropy.id !== message.id) {
          this._bufferAntiEntropy = message
        }
        // #B add the new element to the buffer
        if (message.element) {
          this._bufferAntiEntropy.elements.push(message.element)
        }
        // #C add causality metadata
        if (message.causality) {
          this._bufferAntiEntropy.causality = message.causality
        }
        // #D the buffered message is fully arrived, deliver
        if (this._bufferAntiEntropy.elements.length ===
          this._bufferAntiEntropy.nbElements) {
        // #1 considere each message in the response independantly
          for (let i = 0; i < this._bufferAntiEntropy.elements.length; ++i) {
            let element = this._bufferAntiEntropy.elements[i]
            // #2 only check if the message has not been received yet
            if (!this._shouldStopPropagation(element)) {
              this._causality.incrementFrom(element.id)
              this.emit('receive', message.issuer, element.payload)
            }
          }
          // #3 merge causality structures
          this._causality.merge(this._bufferAntiEntropy.causality)
        }
        break
      }

      default: {
        if (!this._shouldStopPropagation(message)) {
          // #1 register the operation
          // maintain `this._buffer` sorted to search in O(log n)
          const index = sortedIndexBy(this._buffer, message, formatID)
          this._buffer.splice(index, 0, message)
          // #2 deliver
          this._reviewBuffer()
          // #3 rebroadcast
          this._sendAll(message)
        }
        break
      }
    }
  }
  */

  R_broadcast(message){

    const index = sortedIndexBy(this._buffer, message, formatID)
    this._buffer.splice(index, 0, message)

    const n = this._source.getNeighbours(Infinity)
    if (n.length > 0) {
      n.forEach(p => {
        this._unicast.send(p, message).catch(e => {
          debug(e)
        })
      })
    }
    _R_deliver(message)
  }

  _receive(message){

    const index = sortedIndexBy(this._buffer, message, formatID)

    if (!this._buffer[index]) {
      this._buffer.splice(index, 0, message)

      const n = this._source.getNeighbours(Infinity)
      if (n.length > 0) {
        n.forEach(p => {
          this._unicast.send(p, message).catch(e => {debug(e)})
        })
      }
      _R_deliver(message)
    }
  }

  _open(q){
    const n = this._source.getNeighbours(Infinity)

    if(n.length > 1){
      this._causality.increment()
      
      // create a ping p
      // delete q de Q
      bufferMessage.set(q, new Array())
      ping(p, q, this._causality)
    }
  }

  _receivePing(from, to, id){
    pong(from, to, id)
  }

  _receivePong(from, to, id){
    if (bufferMessage.get(to)) {
      bufferMessage.get(to).forEach(m =>{
        this._unicast.send(to, m).catch(e => {debug(e)})
      })
      bufferMessage.delete(to)
      // ajjouter le voisin
    }
  }

  _close(q){
    bufferMessage.delete(q)
  }

  PC_broadcast(message){
    R_broadcast(message)
  }

  _R_deliver(message){
    bufferMessage.forEach(q =>{
      bufferMessage.get(q).push(message)
    })  
    _PC_deliver(message)
  }

  _ping(from, to, id){
    if (retries.get(q)) {retries.get(q) = 0}
    messageId.set(id, to)
  }

  _receiveAck(from, to, id){
    messageId.delete(id)
    retries.delete(to)
  }

  _PC_deliver(message){
    bufferMessage.forEach(q =>{
      if(bufferMessage.get(q).length > maxSize){
        rety(q)
      }
    })
  }

  _close(q){
    messageId.forEach(i =>{
      if(i == q ){
        messageId.delete(i)
      }
    })
    retries.delete(q)
  }

  retry(q){
    messageId.forEach(i =>{
      if(i == q ){
        messageId.delete(i)
      }
    })
    if(retries.get(q)){
      retries.get(q) = retries.get(q) + 1;
      if(retries.get(q) <= maxRetry){
        _open(q)
      } else{
        _close(q)
      }
    }
  }

  _timeout(from, to ,id){
    if(messageId.get(id)){
      retry(to)
    }
  }
}

module.exports = BroadcastNoVector
