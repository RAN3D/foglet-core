'use strict';

const FogletResource = require('./foglet-resource.js');

// get foglet instance from somewhere
const foglet = null;

class EventsResource extends FogletResource {
  constructor (foglet) {
    super('events', foglet);
    this._events = [];
  }

  _get (reply, reject) {
    if (this._events.length === 0)
      reject('No events to send');
    reply(this._events);
  }

  _post (msg, reply) {
    this._events.push(msg.newEvent);
    reply('insert done');
  }

  _patch (msg, reply) {
    this._events[msg.index] = msg.updatedEvent;
    reply('update done');
  }

  _delete (msg, reply) {
    this._events.splice(msg.index, 1);
    reply('delete done');
  }
}

const events = new EventsResource(foglet);

const someID = 'aaa-12-bb-28'; // the id of some remote foglet using the same protocol

events.get(someID)
.then(res => {
  console.log(res);
  events.post(someID, { newEvent: 'save the world!' });
})
.then(() => events.get())
.then(res => {
  console.log(res);
  events.patch(someID, { index: 0, updatedEvent: 'save the world (only on sunday)!' });
})
.then(res => {
  console.log(res);
  events.delete(someID, { index: 0 });
})
.then(res => {
  console.log(res);
  events.get(someID);
})
.then(console.log);
