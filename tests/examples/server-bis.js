const path = require('path')
const FSS = require('foglet-signaling-server')
const fs = require('fs')
const Twilio = require('twilio')
const cors = require('cors')
const express = require('express')
const io = require('socket.io')
const http = require('http')

var corsOptions = {
  origin: 'http://localhost:8000/',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

function run (app, log, host = 'localhost', port = 8000) {
  app.use(cors(corsOptions))
  const twilioconfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'twilio_config.json'), 'utf-8'))
  console.log('Host: ', host)
  console.log('Port: ', port)
  app.all((req, res, next) => {
    console.log(req.url)
  })
  app.use('/jquery', express.static(path.join(__dirname, '../../node_modules/jquery/dist')))
  app.use('/p2p-graph', express.static(path.join(__dirname, '../../node_modules/p2p-graph/')))
  app.use('/chart.js', express.static(path.join(__dirname, '../../node_modules/chart.js/')))
  app.use('/dist', express.static(path.join(__dirname, '../../dist/')))

  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'))
  })

  app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-ice.html'))
  })

  app.get('/signaling', (req, res) => {
    res.sendFile(path.join(__dirname, 'example-signaling.html'))
  })
  app.get('/direct', (req, res) => {
    res.sendFile(path.join(__dirname, 'example-direct.html'))
  })
  app.get('/media', (req, res) => {
    res.sendFile(path.join(__dirname, 'example-media.html'))
  })
  app.get('/stream', (req, res) => {
    res.sendFile(path.join(__dirname, 'example-stream.html'))
  })
  app.get('/spray', (req, res) => {
    res.sendFile(path.join(__dirname, 'example-spray.html'))
  })
  app.get('/tman', (req, res) => {
    res.sendFile(path.join(__dirname, 'example-tman.html'))
  })

  app.get('/ice', function (req, res) {
    console.log('A user want ice from client:')
    try {
      var client = Twilio(twilioconfig.api_key, twilioconfig.api_secret, {accountSid: twilioconfig.sid})
      client.api.account.tokens.create({ttl: 86400}).then(token => {
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

  const httpServer = http.Server(app)

  const ioServer = io(httpServer, {
    origins: 'true'
  })
  ioServer.origins((origin, callback) => {
    callback(null, true)
  })
  FSS(app, log, host, port, ioServer, {}, httpServer)
}

module.exports = run
