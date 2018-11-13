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

const messagesBuffer = require('./messagesBuffer.js')
const causalBuffer = require('./causalBuffer.js')

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

      this.received = []                          // map of messages received
      this.safeNeighbours = []                    // Q
      this.mBuffer = new messagesBuffer()     // B
      this.messagesId = []                        // I
      this.nbRetries = []                         // R
      this.pingCounter = 0                        // counter
      this.causalCounter = 1
      this.cBuffer = new causalBuffer()

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
  send (id, message) {
    console.log('i send my beautiful message: ', id, message)
    var newMessage = {counter: this.causalCounter, message: message, issuer: id}
    this.causalCounter++

    var index = this.received.findIndex(map => map[0] === id)

    if(index == -1){
      this.received.push([id, 0])
      index = this.received.findIndex(map => map[0] === id)
    } 

    this.received[index].splice(1, 1, this.causalCounter)
    this.PC_broadcast(newMessage)
  }

  /**
   * Handler executed when a message is recevied
   * @param  {string} id  - Message issuer's ID
   * @param  {Object} message - The message received
   * @return {void}
   */
  _receive (id, message) {
    this.emit('receive', id, message)

    var index = this.received.findIndex(map => map[0] === message.issuer)

    if(index == -1){
      this.received.push([message.issuer, 0])
      index = this.received.findIndex(map => map[0] === message.issuer)
    } 

    if (message.counter - this.received[index][1] == 1){
      this.received[index].splice(1, 1, message.counter)
      this._sendAll(message)
      this.R_deliver(message)
    } else {
      this.cBuffer.addMessage(id, message)
    }
    
    index = this.cBuffer.findIndex(id)

    
    if(index != -1 && this.cBuffer[index].length > 1){
      var again = false
      do{
        again = false
        for(var i = 1; i < this.cBuffer[index].length; ++i){
          if (this.cBuffer[index][i].counter - this.received[index][1] == 1){
            this.received[index].splice(1, 1, this.cBuffer[index][i].counter)
            this._sendAll(message)
            this.R_deliver(message)
            again = true 
          }
        }
      }while(again)

      if(this.cBuffer[index].length == 0){this.cBuffer.removeUser(id)}
    }
  }

  PC_broadcast(message){
    this.R_broadcast(message)
  }

  R_broadcast(message){
    this._sendAll(message)
    this.R_deliver(message)
  }

  PC_deliver(message){
    for(var i = 0; i < this.mBuffer.length; ++i){
      if(this.mBuffer[i].length > maxSize){
        this.retry(this.mBuffer[i])
      }
    }
  }

  R_deliver(message){
    this.mBuffer.addMessage(message)
    this.PC_deliver(message)
  }

  receiveAck(from, to, id){
    var index = this.messageId.findIndex(message => message[0] === id)
    this.messageId.splice(index, 1)
    var index = this.nbRetries.findIndex(user => user[0] === to)
    this.nbRetries.splice(index, 1)
  }

  // TODO : not sure this is correct
  receivePing(from, to, id){
    this.pong(from, to, id)
  }

  receivePong(from, to, id){
    var index = this.mBuffer.findIndex(user => user[0] === to)
    if(index != -1){
      for(var i = 1; i < this.mBuffer[index].length; i++){
        this.send(to, this.mBuffer[index][i])
      }
      this.mBuffer.splice(index, 1)
      this._source.getNeighbours().push(to)
    }
  }

  open(q){
    if (this._source.getNeighbours().length > 0) {
      this.pingCounter = this.pingCounter + 1
      mBuffer.addUser(q)                   
      this.ping(this.options.id, q, this.pingCounter)
    }
  }

  close(q){
    var index = this.mBuffer.findIndex(user => user[0] === q)
    if(index != -1){
      this.mBuffer.splice(index, 1)
    }

    for(var i = 0; i < messageId.length; ++i){
      if(this.messageId[i][1] === q){
        this.messageId.splice(i, 1)
      }
    }
    var index = this.nbRetries.findIndex(user => user[0] === q)
    this.nbRetries.splice(index, 1)
  }

  ping(from, to, id){
    var result = this.nbRetries.findIndex(user => user[0] === from)
    if (result == -1){
      this.nbRetries.push([from, 0])
    }
    var index = this.messageId.findIndex(message => message[0] === id)
    this.messageId.push([id, to])
    console.error("ping send")
  }

  retry(q){
    for(var i = 0; i < messageId.length; ++i){
      if(this.messageId[i][1] === q){
        this.messageId.splice(i, 1)
      }
    }
    var index = this.mBuffer.findIndex(user => user[0] === q)
    if(result != -1){
      this.mBuffer[index].splice(1, 1, this.mBuffer[index][1] +1)
      if(this.mBuffer[index][1] <= this.maxRetry){
        this.open(q)
      }else{
        this.close(q)
      }
    }
  }

  timeout(from, to, id){
    var index = this.messageId.findIndex(message => message[0] === id)
    if(index != -1){
      this.retry(to)
    }
  }
}

module.exports = Broadcast
