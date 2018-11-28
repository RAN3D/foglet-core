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
          this.open(id)
        }
      })
      const self = this

      // Connexions inview et outview donc ne récupérer que les outview
      this._source.rps.on('close', (id) => {
        console.log('[%s] close', this.options.id, id)
        this.closeConnection(id)
      })

      // the id is your id, base on the .PEER id in the RPS options
      this._causality = new VVwE(this.options.id)

      this.received = []                          // map of messages received
      this.safeNeighbours = []                    // Q
      this.mBuffer = new messagesBuffer()         // B
      this.pingPongCounter = []                   // I Use to check the pong id (counter) with the buffer id (counter)
      this.nbRetries = []                         // R
      this.pingCounter = 1                        // counter
      this.causalCounter = 1
      this.cBuffer = new causalBuffer()
      this.receivedPing = []

      this.timeout = 120 * 1000                   // The timer use for the timeout function

      // Number of messages in the buffer when trying to make a new safe connection
      this.maxSize = 2
      // Number of retry when trying to make a new safe connection
      this.maxRetry = 3
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
  _sendAll(message) {
    //send to safe neighbours
    const n = this.safeNeighbours
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

    //Following conditions are only use for tests and debug
    // This is just use to show the neighbours of an user
    if(message == 'neighbours'){
      //print process and his safeNeighbours
      console.log(id + ' neighbours  : ' + this.safeNeighbours)
    // Use to send a real message to antoher user
    }else if(message.message == 'differe'){
      //print the message we will send

      // We modify the message to add the causal counter and the id of the issuer in it
      var newMessage = {counter: this.causalCounter, message: message, issuer: id}
      this.causalCounter++

      //Search if the message we will send was already saw
      var index = this.received.findIndex(map => map[0] === id)

      //If we never receive a message from this user we had it to our array
      if(index == -1){
        this.received.push([id, 0])
        index = this.received.findIndex(map => map[0] === id)
      }

      // We update the causal counter
      this.received[index].splice(1, 1, this.causalCounter)

      setTimeout(() =>{
        console.log('i send my beautiful message: ', id, message)
        this.PC_broadcast(newMessage)
      }, message.time)

    }else if(message.message == 'open'){
      console.log("open connection on our own because cyclon is strange : " + this.options.id + " with " + message.id)
      this.open(message.id + '-I')

    }else if(message.message == 'open with time'){
      console.log("open connection on our own because cyclon is strange : " + this.options.id + " with " + message.id + ' but with delay')
      this.openTime(message.id + '-I')

    }else if(message.message == 'disconnect'){
      this.closeConnection(message.id + '-I')

    }else if(message.message == 'disconnect all'){
      this.safeNeighbours.splice(0, this.safeNeighbours.length)

    }else if(message.message == 'buffer'){
      console.log(this.mBuffer)

    }else if(message.message == 'clear'){
      this.mBuffer.clear()

    // Use to send a real message to antoher user aka the normal condition
    }else{
      //print the message we will send
      console.log('i send my beautiful message: ', id, message)
      // We modify the message to add the causal counter and the id of the issuer in it
      var newMessage = {counter: this.causalCounter, message: message, issuer: id}
      this.causalCounter++

      //Search if the message we will send was already saw
      var index = this.received.findIndex(map => map[0] === id)

      //If we never receive a message from this user we had it to our array
      if(index == -1){
        this.received.push([id, 0])
        index = this.received.findIndex(map => map[0] === id)
      }

      // We update the causal counter
      this.received[index].splice(1, 1, this.causalCounter)

      this.PC_broadcast(newMessage)
    }
  }

  /**
  * Use to send a simple message with unicast to another user
  * @private
  * @param  {Object} to - The user who will receive the message
  * @param  {Object} message - The message to send
  * @return {void}
  */
  sendTo(to, message){
    this._unicast.send(to, message).catch(e => {
      debug(e)
    })
  }

  /**
   * Handler executed when a message is recevied
   * @param  {string} id  - Message issuer's ID
   * @param  {Object} message - The message received
   * @return {void}
   */
  _receive (id, message) {
    this.emit('receive', id, message)

    // if the message recieve is a ping and not a typical message
    if(message.ping != undefined){

      var index = this.options.id.search('-I') + 2
      var thisId = this.options.id.substring(0, index)

      //Search if we already saw a ping from the issuer
      var index = this.receivedPing.findIndex(user => user[0] === message.issuer)
      if(index == -1){
        this.receivedPing.push([message.issuer, 0])
        index = this.receivedPing.findIndex(user => user[0] === message.issuer)
      }
      // We check if we already received this ping
      if(message.ping > this.receivedPing[index][1]){
        this.receivedPing[index].splice(1, 1, message.ping)
        // If the ping is destinated to the current user we use the fonction receivePing
        if(message.receiver == thisId){

          // Use this for test
          if(message.message == 'wait'){
            this.receivePingTime(message.issuer, message.receiver, message.ping)

          // Normal behavior
          }else{
            this.receivePing(message.issuer, message.receiver, message.ping)
          }
        // Else we send it to all of our safe neighbours
        } else{
          this._sendAll(message)
        }
      }
      // If it's a pong and not a typical message
    }else if(message.pong != undefined){
      this.receivePong(message.issuer, message.receiver, message.pong)
    // Else it's a normal message
    }else{

      console.log(this.options.id + ' : ' + id + ' send me this : ' + message.message + ' from ' + message.issuer + ' causal counter : ' + message.counter)

      var indexI = this.received.findIndex(map => map[0] === message.issuer)

      if(indexI == -1){
        this.received.push([message.issuer, 0])
        indexI = this.received.findIndex(map => map[0] === message.issuer)
      }

      // If this message is received in the causal order we deliver it to our safe neighbours
      if (message.counter - this.received[indexI][1] == 1){
        //This is used for test
        if(message.message.wait != undefined){
          this.received[indexI].splice(1, 1, message.counter)
          this._sendAll(message)
          this.R_deliverTime(message)

        // This is the normal behavior
        }else{
          this.received[indexI].splice(1, 1, message.counter)
          this._sendAll(message)
          this.R_deliver(message)
        }
      // Else we put it in a buffer
      } else if((message.counter - this.received[indexI][1]) > 1){
        this.cBuffer.addMessage(message.issuer, message)
      }

      var indexB = this.cBuffer.findIndex(message.issuer)

      // If there is messages in the buffer we check them and deliver them if they are in the order of our causal order
      if(indexB != -1 && this.cBuffer.length(indexB) > 1){
        var again = false
        do{
          again = false
          for(var i = 1; i < this.cBuffer.length(indexB); i++){
            if (this.cBuffer.getMessage(indexB, i).counter - this.received[indexI][1] == 1){
              this.received[indexI].splice(1, 1, this.cBuffer.getMessage(indexB, i).counter)
              this._sendAll(this.cBuffer.getMessage(indexB, i))
              this.R_deliver(this.cBuffer.getMessage(indexB, i))
              again = true
            }
          }
        }while(again)

        if(this.cBuffer.length(indexB) == 0){this.cBuffer.removeUser(id)}
      }
    }
  }

  PC_broadcast(message){
    this.R_broadcast(message)
  }

  R_broadcast(message){
    this._sendAll(message)
    this.R_deliver(message)
  }

  R_deliver(message){
    this.mBuffer.addMessageAll(message)
    this.PC_deliver(message)
  }

  PC_deliver(message){
    for(var i = 0; i < this.mBuffer.getLength(); ++i){
      if(this.mBuffer.getLengthIndex(i) - 1 > this.maxSize){
        this.retry(this.mBuffer.getUser(i))
      }
    }
  }


  /**
  * Use to notify the user when he receive a ping
  * @private
  * @param  {Object} from - The user who sent the ping
  * @param  {Object} to - The user who's receiving the ping
  * @param  {int} counter - The counter of the ping
  * @return {void}
  */
  receivePing(from, to, counter){
    this.pong(to, from, counter)
  }

  /**
  * Use to notify the user when he receive a pong
  * @private
  * @param  {Object} from - The user who sent the pong
  * @param  {Object} to - The user who's receiving the pong
  * @param  {int} counter - The counter of the pong
  * @return {void}
  */
  receivePong(from, to, counter){
    var isGood = false;

    for(var i = 0; i < this.pingPongCounter.length; ++i){
      if(this.pingPongCounter[i][1] == from){
        if(counter == this.pingPongCounter[i][0]){
          isGood = true
          break
        }
      }
    }

    if(isGood){
      this.safeNeighbours.push(from)

      var index = this.mBuffer.findIndex(from)

      if(index != -1){
        for(var i = 1; i < this.mBuffer.getLengthIndex(index); ++i){
          this.sendTo(from, this.mBuffer.getMessage(index, i))
        }
        this.mBuffer.removeUser(from)
      }

      var index = this.pingPongCounter.findIndex(message => message[0] === counter)
      this.pingPongCounter.splice(index, 1)

      var index = this.nbRetries.findIndex(user => user[0] === to)
      this.nbRetries.splice(index, 1)
    }
  }

  /**
  * Use to send a ping to another user
  * @private
  * @param  {Object} from - The user who's sending the ping
  * @param  {Object} to - The user who will receive the ping
  * @param  {int} counter - The counter of the ping
  * @return {void}
  */
  ping(from, to, counter){
    var result = this.nbRetries.findIndex(user => user[0] === to)
    if (result == -1){
      this.nbRetries.push([to, 0])
    }

    this.pingPongCounter.push([counter, to])
    var message = {issuer: from, receiver: to, ping: counter}

    this._sendAll(message)
  }

  /**
   * Use to send a pong to another user
   * @private
   * @param  {Object} from - The user who's sending the pong
   * @param  {Object} to - The user who will receive the pong
   * @param  {int} counter - The counter of the ping
   * @return {void}
   */
  pong(from, to, counter){
    var message = {issuer: from, receiver: to, pong: counter}
    this.sendTo(to, message)
  }

  /**
   * Use to open a safe connection with another user
   * @private
   * @param  {Object} q - The user with who the connection will be open
   * @return {void}
   */
  open(q){
    if(this.safeNeighbours.length == 0){
      this.safeNeighbours.push(q)
    } else if (this.safeNeighbours.findIndex(user => user === q) == -1) {
      this.pingCounter = this.pingCounter + 1
      this.mBuffer.addUser(q)
      var index = this.options.id.search('-I') +2
      var thisId = this.options.id.substring(0, index)
      this.ping(thisId, q, this.pingCounter)
    }
  }


  /**
   * Use to clean the arrays when the safe connection has failed
   * @private
   * @param  {Object} q - The user with who the connection will be close
   * @return {void}
   */
  close(q){

    if(this.safeNeighbours.length > 1){
      this.mBuffer.removeUser(q)

      for(var i = 0; i < this.pingPongCounter.length; ++i){
        if(this.pingPongCounter[i][1] === q){
          this.pingPongCounter.splice(i, 1)
        }
      }
      var index = this.nbRetries.findIndex(user => user[0] === q)
      if(index != -1){
        this.nbRetries.splice(index, 1)
      }
    }
  }

  /**
   * Use to close a safe connection with another user
   * @private
   * @param  {Object} q - The user with who the connection will be close
   * @return {void}
   */
  closeConnection(q){
    if(this.safeNeighbours.length > 1){
      var index = this.safeNeighbours.findIndex(user => user === q)
      if(index != -1){
        this.safeNeighbours.splice(index, 1)
      }
    }
  }

  retry(q){
    for(var i = 0; i < this.pingPongCounter.length; ++i){
      if(this.pingPongCounter[i][1] === q){
        this.pingPongCounter.splice(i, 1)
      }
    }

    var index = this.nbRetries.findIndex(user => user[0] === q)
    if(index != -1){
      this.nbRetries[index].splice(1, 1, this.nbRetries[index][1] + 1)
      if(this.nbRetries[index][1] <= this.maxRetry){
        this.open(q)
      }else{
        this.close(q)
      }
    }
  }

  /**
   * Use to retry to send a ping to make a safe connection
   * @private
   * @param  {Object} from - The user who's sending the ping
   * @param  {Object} to - The user who will receive the ping
   * @param  {int} counter - The counter of the ping
   * @return {void}
   */
  timeout(from, to, counter){
    var index = this.pingPongCounter.findIndex(message => message[0] === counter)
    if(index != -1){
      this.retry(to)
    }
  }

  //******************************* Testing functions *******************************//

  openTime(q){
    if(this.safeNeighbours.length == 0){
      this.safeNeighbours.push(q)
    } else if (this.safeNeighbours.findIndex(user => user === q) == -1) {
      this.pingCounter = this.pingCounter + 1
      this.mBuffer.addUser(q)
      var index = this.options.id.search('-I') +2
      var thisId = this.options.id.substring(0, index)
      this.pingTime(thisId, q, this.pingCounter)
    }
  }

  // Use for testing
  pingTime(from, to, counter){
    var result = this.nbRetries.findIndex(user => user[0] === to)
    if (result == -1){
      this.nbRetries.push([to, 0])
    }

    this.pingPongCounter.push([counter, to])
    var message = {issuer: from, receiver: to, ping: counter, message : 'wait'}

    this._sendAll(message)
  }

  receivePingTime(from, to, counter){
    setTimeout(() => {
      this.pong(to, from, counter)
    }, 6 * 1000)
  }

  PC_broadcastTime(message){
      this.R_broadcastTime(message)
  }

  R_broadcastTime(message){
    this._sendAll(message)
    this.R_deliverTime(message)
  }

  R_deliverTime(message){
    this.mBuffer.addMessageAll(message)
    this.PC_deliverTime(message)
  }

  PC_deliverTime(message){
    for(var i = 0; i < this.mBuffer.getLength(); ++i){
      if(this.mBuffer.getLengthIndex(i) - 1 > this.maxSize){
        this.retryTime(this.mBuffer.getUser(i))
      }
    }
  }

  retryTime(q){
    for(var i = 0; i < this.pingPongCounter.length; ++i){
      if(this.pingPongCounter[i][1] === q){
        this.pingPongCounter.splice(i, 1)
      }
    }

    var index = this.nbRetries.findIndex(user => user[0] === q)
    if(index != -1){
      this.nbRetries[index].splice(1, 1, this.nbRetries[index][1] + 1)
      if(this.nbRetries[index][1] <= this.maxRetry){
        this.openTime(q)
      }else{
        this.close(q)
      }
    }
  }
}

module.exports = Broadcast
