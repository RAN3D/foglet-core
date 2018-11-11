const Turn = require('node-turn');
console.log(`HOST: ${process.env.HOST} PORT: ${process.env.PORT}`)
const server = new Turn({
  realm: process.env.HOST,
  listeningPort: process.env.PORT,
  listeningIps: [process.env.HOST],
  debugLevel: 'ALL',
  authMech: 'long-term',
  credentials: {
    username: "password"
  }
})
server.start()
