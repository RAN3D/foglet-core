/* Testing utilities */
'use strict';
const uuid = require('uuid/v4');

const buildFog = (Foglet, size) => {
  const fog = [];
  // creates a random seed for romm & protocol
  const id = uuid();
  for (let i = 0; i < size; i++)
    fog.push(new Foglet({
      protocol: `test-protocol-generated-${id}`,
      webrtc: {
        trickle: true,
        iceServers: []
      },
      room: `test-room-generated-${id}`
    }));
  return fog;
};

module.exports = {
  buildFog
};
