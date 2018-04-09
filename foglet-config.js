'use strict'
module.exports = {
  browsers: [ 'Firefox' ],
  timeout: 20000,
  lint: true,
  build: require('./foglet-webpack-config')
}
