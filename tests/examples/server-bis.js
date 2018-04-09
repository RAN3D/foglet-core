const path = require('path')
const FSS = require('foglet-signaling-server')
const fs = require('fs')
const Twilio = require('twilio')
const express = require('express')

function run (app, log, host = 'localhost', port = 3000) {
  const twilioconfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'twilio_config.json'), 'utf-8'))
  console.log('Host: ', host)
  console.log('Port: ', port)

  app.use('/jquery', express.static(path.join(__dirname, '../../node_modules/jquery/dist')))
  app.use('/dist', express.static(path.join(__dirname, '../../dist/')))

  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'example-signaling.html'))
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

  FSS(app, log, host, port)
}

module.exports = run
