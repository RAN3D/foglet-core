const express = require('express')
const app = express()
const host = process.env.HOST || 'localhost'
const port = parseInt(process.env.PORT) || 8000
const fss = require('./server-bis')
fss(app, console.log, host, port)
