const Server = require('n2n-wrtc/lib/signaling/server').server
const Twilio = require('twilio')
const fs = require('fs')
const path = require('path')
const Express = require('express')

const HOST = process.env.HOST || "localhost"
console.log('HOST: ' , HOST)
const PORT = process.env.PORT || 5000
console.log('PORT: ',  PORT)

const twilioconfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'twilio.config.json'), 'utf-8'))

const app = Express()

app.get('/', function (req, res) {
  res.send()
})

app.get('/localice', function (req, res) {
  res.json({
    information: 'THIS IS FOR TESTS PURPOSES ONLY',
    iceServers: [{
      urls: [`stun:${HOST}:${PORT}`]
    }, {
      urls: [`turn:${HOST}:${PORT}?transport=udp`],
      username: 'username',
      credential: 'password'
    }]
  })
})

app.get('/twilioice', function (req, res) {
  console.log('A user want ice from client:')
  try {
    var client = Twilio(twilioconfig.api_key, twilioconfig.api_secret, {accountSid: twilioconfig.sid})
    client.api.account.tokens.create({ttl: 86400}).then(token => {
      const iceServers = []
      token.iceServers.forEach(ice => {
        const transform = {urls: [ice.url]}
        if (ice.username) transform.username = ice.username
        if (ice.credential) transform.credential = ice.credential
        iceServers.push(transform)
      })
      res.json({ information: "THIS IS FOR TESTS PURPOSES ONLY", iceServers })
    }).catch(error => {
      console.log(error)
    })
  } catch (e) {
    console.log(e)
    res.send('Error when getting your credentials.')
  }
})


Server({
  app,
  port: PORT,
  host: HOST,
  max: 50
})
