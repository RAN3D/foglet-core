'use strict'
const path = require('path')
const webpackconfig = require('./foglet-webpack-config')

module.exports = {
  browsers: [ 'Firefox' ],
  timeout: 20000,
  lint: true,
  build: webpackconfig
}
