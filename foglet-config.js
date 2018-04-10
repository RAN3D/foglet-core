'use strict'
module.exports = {
  browsers: [ 'Firefox' ],
  timeout: 30000,
  exclude: ['tests/test.js'],
  lint: true,
  build: require('./foglet-webpack-config')
}
