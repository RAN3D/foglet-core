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

      this.received = []          // map of messages received
      this.safeNeighbours = []    // Q
      this.bufferedMessages = []  // B
      this.messagesId = []        // I
      this.nbRetries = []         // R
      this.counter                // counter

      this.maxSize = Number.MAX_SAFE_INTEGER
      this.maxRetry = Number.MAX_SAFE_INTEGER
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
    //send to safe neighbours
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
    if(this.received.find(function(element) {
      return element == message
    }) == null){
      this.received.push(message)
      this.safeNeighbours.forEach(p => {
        send(m, p)
      });
      this.R_deliver(message)
    }
  }

  R_broadcast(m){
    this.received.push(m)
    this.safeNeighbours.forEach(p => {
      send(m, p)
    });
    R_deliver(m)
  }

  open(q){
  
    if (this.safeNeighbours.length > 0) {
      this.counter = this.counter + 1
      B[q] = []          // We delete the buffered messages for q
      ping(this.options.id, q, this.counter) // What do we send as p ? 
    }
  }

  receivePing(from, to, id){
    pong(from, to, id)
  }

  receivePong(from, to, id){
    const result = this.bufferedMessages.find(user => user[0] === to)
    if(result != null){
      var index = this.bufferedMessages.indexOf(user => user[0] === to)
      this.bufferedMessages[index].forEach(m => {
        send(m, to)
      });
      this.bufferedMessages.splice(index, 1)
      this.safeNeighbours.push(to)
    }
  }

  close(q){
    var index = this.bufferedMessages.indexOf(user => user[0] === q)
    this.bufferedMessages.splice(index, 1)
  }

  PC_broadcast(m){
    R_broadcast(m)
  }

  R_deliver(m){
    this.bufferedMessages.forEach(q =>{
      this.bufferedMessages[q].push(m)
    })
    this.PC_deliver(m)
  }

  ping(from, to, id){
    const result = this.nbRetries.find(user => user[0] === from)
    if (result != null){
      var index = this.nbRetries.indexOf(user => user[0] === from)
      this.nbRetries[index].splice(2, 1, 0)
    }
    var index = this.messageId.indexOf(message => message[0] === id)
    this.messageId[index].splice(2, 1, to)
  }

  receiveAck(from, to, id){
    var index = this.messageId.indexOf(message => message[0] === id)
    this.messageId.splice(index, 1)
    var index = this.nbRetries.indexOf(message => message[0] === to)
    this.nbRetries.splice(index, 1)
  }

  PC_deliver(m){
    this.bufferedMessages.forEach(q =>{
      if(this.bufferedMessages[q].length > maxSize){
        rety(q)
      }
    })
  }

  close(q){
    var index = this.bufferedMessage.indexOf(user => user[0] === q)
    this.bufferMessage.slice(index, 1)
    var index = this.messageId.indexOf(message => message[0] === q)
    this.messageId.slice(index, 1)
    var index = this.nbRetries.indexOf(message => message[0] === q)
    this.nbRetries.splice(index, 1)
  }

  retry(q){
    var index = this.messageId.indexOf(message => message[0] === q)
    this.messageId.slice(index, 1)
    var index = this.bufferedMessages.indexOf(user => user[0] === q)
    if(result != null){
      this.bufferedMessages[index].splice(2,1,this.bufferedMessages[index][1] +1)
      if(this.bufferedMessages[index][1] < this.maxRetry){
        open(q)
      }else{
        close(q)
      }
    }
  }

  timeout(from, to, id){
    const result = this.nbRetries.find(message => message[0] === id)
    if(result != null){
      retry(to)
    }
  }
}

module.exports = Broadcast
