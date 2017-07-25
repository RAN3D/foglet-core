/* Testing utilities */
'use strict';
const uuid = require('uuid/v4');

const buildFog = (Foglet, size) => {
  const fog = [];
  // creates a random seed for romm & protocol
  const id = uuid();
  for (let i = 0; i < size; i++)
    fog.push(new Foglet({
      rps: {
        type: 'spray-wrtc',
        options: {
          protocol: `test-protocol-generated-${id}`,
          webrtc:	{ // add WebRTC options
            trickle: true, // enable trickle (divide offers in multiple small offers sent by pieces)
            iceServers : [] // define iceServers in non local instance
          },
          timeout: 2 * 60 * 1000, // spray-wrtc timeout before definitively close a WebRTC connection.
          delta: 10 * 1000, // spray-wrtc shuffle interval
          signaling: {
            address: 'http://localhost:3000',
            // signalingAdress: 'https://signaling.herokuapp.com/', // address of the signaling server
            room: `test-room-generated-${id}`
          }
        }
      }
    }));
  return fog;
};

module.exports = {
  buildFog
};
