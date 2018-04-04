const path = require('path')
const express = require('express')
const app = express()
const FSS = require('foglet-signaling-server')

const host = process.env.HOST || 'localhost'
const port = parseInt(process.env.PORT) || 3000
console.log('Host: ', host)
console.log('Port: ', port)


app.use('/foglet.bundle.js', express.static(path.join(__dirname, '../../dist/foglet.bundle.js')))

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'example-signaling.html'))
})

FSS(app, console.log, host, port)
