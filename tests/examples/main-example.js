const EventEmitter = require('events')
const Errors = {
  notYetImplemented: (message, error) => new Error('Not yet implemented: ' + message, error)
}

class CommunicationInterface extends EventEmitter {
  constructor (fognet) {
    super()
    this.network = fognet
  }
  /**
   * Send a message using this Communication interface
   * @param  {Object} m the message to send
   * @return {Promise} Return a Promise resolved when the message is sent.
   */
  send (m) {
    throw new Error('not yet implemented')
  }
  /**
   * You are responsible to call this method when you have to deliver a message
   * @param  {Object} m the message to deliver
   * @return {void}
   */
  _receive (m) {
    /**
     * @event CommunicationInterface#receive
     * @type {Object}
     */
    this.emit('receive', m)
  }
}

/**
 * This is an Abstract Class
 * @extends EventEmitter
 */
class FogNet extends EventEmitter {
  constructor (options) {
    super()
    this.options = options
  }

  get communication () {
    return new CommunicationInterface (this)
  }
}

const Spray = class extends FogNet {}
const FullMesh = class extends FogNet {}
const TMan = class extends FogNet {}

class CausalSpray extends Spray {
  send (m) {
    super.receive(m)
  }
}

class Counter extends EventEmitter {
  constructor (init = 0, id, fogNet) {
    if (!id || !fogNet) throw new Error('please provide an id and a fogNet')
    super()
    this.network = fogNet
    this.x = init
    this.network.on('receive', (message) => {
      if (message.id === this.id) {
        this.x = message.x
      }
    })
  }
  /**
   * Initialize the structure
   * @return {Promise}
   */
  init () {
    return this.network.connect()
  }
  /**
   * Increment by one the local value
   * @return {[type]} [description]
   */
  increment () {
    this.x++
    this.network.broadcast({ x: this.getValue(), id: this.id })
    return this.getValue()
  }
  getValue () {
    return this.x
  }
}

const Foglet = {
  abstract: {
    FogNet
  },
  fognets: { CausalSpray, Spray, FullMesh, TMan },
  datastructure: { Counter }
}

class SurveyYesNo {
  constructor (question) {
    this.question = question
    try {
      this.fognet = new Foglet.fognets.CausalSpray({ seed: 'toto.com' })
    } catch (e) {
      console.error(e)
    }
    this.counterYes = new Counter(0, 'yes', this.fognet)
    this.counterYes = new Counter(0, 'no', this.fognet)
  }
  updateUI (yesval, noval) {
    console.log('Question: ', this.question)
    console.log('Yes: ', yesval)
    console.log('No: ', noval)
  }
  addYes () {
    this.counterYes.increment()
  }
  addNo () {
    this.counterNo.increment()
  }
}

const app = new SurveyYesNo('Can birds fly?')
app.addYes()
app.addNo()
