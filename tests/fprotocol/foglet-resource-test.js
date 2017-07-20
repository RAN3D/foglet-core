'use strict';

const Foglet = require('../../src/foglet.js').Foglet;
const FogletResource = require('../../src/fprotocol/foglet-resource.js');
const buildFog = require('../utils.js').buildFog;

class StudentResource extends FogletResource {
  constructor (foglet) {
    super('students', foglet);
    this._students = [];
  }

  _get (msg, reply) {
    reply(this._students);
  }

  _insert (msg, reply) {
    this._students.push(msg.student);
    reply('new student inserted');
  }

  _update (msg, reply) {
    this._students[msg.index] = msg.student;
    reply('student updated');
  }

  _delete (msg, reply) {
    this._students.splice(msg.index, 1);
    reply('student deleted');
  }
}

describe('FogletResource', () => {
  it('should support foglet resource with get/insert/update/delete operations', done => {
    const foglets = buildFog(Foglet, 2);
    let f1 = foglets[0], f2 = foglets[1];
    const s1 = new StudentResource(f1),
      s2 = new StudentResource(f2);
    f1.connection(f2).then(() => {
      const peers = f1.getNeighbours();
      assert.equal(peers.length, 1);
      const peerID = peers[0];

      s1.get(peerID)
      .then(students => {
        assert.equal(students.length, 0);
        return s1.insert(peerID, { student: 'Bob the genious' });
      })
      .then(msg => {
        assert.equal(msg, 'new student inserted');
        return s1.get(peerID);
      })
      .then(students => {
        assert.equal(students.length, 1);
        assert.equal(students[0], 'Bob the genious');
        return s1.update(peerID, { index: 0, student: 'Bob the classic student' });
      })
      .then(msg => {
        assert.equal(msg, 'student updated');
        return s1.get(peerID);
      })
      .then(students => {
        assert.equal(students.length, 1);
        assert.equal(students[0], 'Bob the classic student');
        return s1.delete(peerID, { index: 0 });
      })
      .then(msg => {
        assert.equal(msg, 'student deleted');
        return s1.get(peerID);
      })
      .then(students => {
        assert.equal(students.length, 0);
        done();
      })
      .catch(done);
    });
  });
});
