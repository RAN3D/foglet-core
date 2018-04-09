const path = require('path')
const express = require('express')
const app = express()
const FSS = require('foglet-signaling-server')
const fs = require('fs')
const Twilio = require('twilio')
const host = process.env.HOST || 'localhost'
const port = parseInt(process.env.PORT) || 3000

const twilioconfig = JSON.parse(fs.readFileSync(__dirname + '/twilio_config.json', 'utf-8'))

console.log('Host: ', host)
console.log('Port: ', port)

app.use('/jquery', express.static(path.join(__dirname, '../../node_modules/jquery/dist')))
app.use('/foglet.bundle.js', express.static(path.join(__dirname, '../../dist/foglet.bundle.js')))

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'example-signaling.html'))
})

app.get('/ice', function (req, res) {
  console.log('A user want ice from client:')
  try {
    var client = Twilio(twilioconfig.api_key, twilioconfig.api_secret, {accountSid: twilioconfig.sid})
    client.api.account.tokens.create({}).then(token => {
      console.log(token.iceServers)
      res.send({ ice: token.iceServers })
    }).catch(error => {
      console.log(error)
    })
  } catch (e) {
    console.log(e)
    res.send('Error when getting your credentials.')
  }
})

FSS(app, console.log, host, port)
