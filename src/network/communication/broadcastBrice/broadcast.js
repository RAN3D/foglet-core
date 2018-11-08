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
class Broadcast extends AbstractBroadcast {
  
  var received = []          // set of received messages
  var safeNeighbours = []    // Q
  var bufferedMessages = []  // B
  var messagesId = []        // I
  var nbRetries = []         // R
  var counter = []           // counter

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
      // Connexions inview et outview donc ne récupérer que les outview
      this._source.rps.on('open', (id) => {
        if(this._source.getNeighbours().includes(id)) {
          console.log('[%s] open', this.options.id, id)
        }
      })
      const self = this

      // Connexions inview et outview donc ne récupérer que les outview
      this._source.rps.on('close', (id) => {
        console.log('close', id)
      })

      // the id is your id, base on the .PEER id in the RPS options
      this._causality = new VVwE(this.options.id)
      // buffer of received messages
      this._buffer = []
    } else {
      return new Error('Not enough parameters', 'fbroadcast.js')
    }
  }

  /**
   * Send a message to all neighbours
   * @private
   * @param  {Object} message - The message to send
   * @return {void}
   */
  _sendAll (message) {
    const n = this._source.getNeighbours()
    // please select all distinct ids
    if (n.length > 0) {
      n.forEach(p => {
        this._unicast.send(p, message).catch(e => {
          debug(e)
        })
      })
    }
  }

  /**
   * Send a message in broadcast
   * @param  {Object}  message  - The message to send
   * @param  {Object} [id] {e: <stringId>, c: <Integer>} this uniquely represents the id of the operation
   * @param  {Object} [isReady] {e: <stringId>, c: <Integer>} this uniquely represents the id of the operation that we must wait before delivering the message
   * @return {boolean}
   */
  send (message, id) {
    console.log('i send my beautiful message: ', this.options.id, message)
    this._receive(this.options.id, message)
    this._sendAll(message)
  }

  /**
   * Handler executed when a message is recevied
   * @param  {string} id  - Message issuer's ID
   * @param  {Object} message - The message received
   * @return {void}
   */
  _receive (id, message) {
    this.emit('receive', id, message)
    if(received.find(function(element) {
      return element == message
    }) == null){
      received.push(message)
      safeNeighbours.forEach(p => {
        send(m, p)
      });
      R_deliver(m)
    }
  }

  R_broadcast(m){
    received.push(m)
    safeNeighbours.forEach(p => {
      send(m, p)
    });
    R_deliver(m)
  }

  open(q){
  
    if (safeNeighbours.length > 0) {
      counter = counter + 1
      B[q] = []          // We delete the buffered messages for q
      ping(, q, counter) // What do we send as p ? 
    }
  }

  receivePing(from, to, id){
    pong(from, to, id)
  }

  receivePong(from, to, id){
    const result = bufferedMessages.find(user => user[0] === to)
    if(result != null){
      var index = bufferedMessages.indexOf(user => user[0] === to)
      bufferedMessages[index].forEach(m => {
        send(m, to)
      });
      bufferedMessages.splice(index, 1)
      safeNeighbours.push(to)
    }
  }

  close(q){
    var index = bufferedMessages.indexOf(user => user[0] === q)
    bufferedMessages.splice(index, 1)
  }

  PC_broadcast(m){
    R_broadcast(m)
  }

  R_deliver(m){
    bufferedMessages.forEach(q =>{
      bufferedMessages[q].push(m)
    })
    PC_deliver(m)
  }

  ping(from, to, id){
    const result = nbRetries.find(user => user[0] === from)
    if (result != null){
      var index = nbRetries.indexOf(user => user[0] === from)
      nbRetries[index].splice(2,1, 0)
    }
    var index = messageId.indexOf(message => message[0] === id)
    messageId[index].splice(2,1,to)
  }

  receiveAck(from, to, id){
    messageId
  }

  PC_deliver(m){
    bufferedMessages.forEach(q =>{
      if(bufferMessage.get(q).length > maxSize){
        rety(q)
      }
    })
  }

  close(q){
    bufferMessage.delete(q)
  }

}

module.exports = Broadcast
