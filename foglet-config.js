'use strict'
module.exports = {
  browsers: [ 'Firefox' ],
  timeout: 60000,
  lint: true,
  build: require('./foglet-webpack-config')
}
