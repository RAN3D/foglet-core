const { constants } = require('karma')
const fogletoptions = require('./foglet-config')
const webpack = require('./foglet-webpack-config.js')
webpack.module.rules.push({
  test: /\.js$/,
  exclude: /(node_modules|bower_components)/,
  use: {
    loader: 'istanbul-instrumenter-loader'
  }
})
webpack.module.rules.push({
  enforce: 'pre',
  test: /\.js?$/,
  loader: 'standard-loader',
  exclude: /(node_modules|bower_components)/,
  options: {
    error: false,
    snazzy: true,
    env: [ 'browser', 'es6', 'worker', 'mocha', 'jasmine' ],
    globals: [ 'assert' ]
  }
})

module.exports = {
  hostname: 'localhost',
  basePath: './',
  frameworks: [ 'mocha', 'chai' ],
  files: [
    'tests/*test.js',
    'tests/**/*test.js'
  ],
  preprocessors: {
    'tests/*test.js': [ 'webpack' ],
    'tests/**/*test.js': [ 'webpack' ]
  },
  exclude: fogletoptions.exclude,
  webpack: require('./foglet-webpack-config.js'),
  extensions: [ '.js' ],
  port: 4001,
  reporters: [ 'mocha', 'coverage' ],
  coverageIstanbulReporter: {
    reports: [ 'text-summary', 'lcov' ],
    fixWebpackSourcePaths: true
  },
  client: {
    mocha: {
      timeout: fogletoptions.timeout
    }
  },
  proxies: {
    '/socket.io/': 'http://localhost:3000/socket.io/'
  },
  autoWatch: false,
  browserNoActivityTimeout: 30000,
  colors: true,
  browsers: fogletoptions.browsers,
  logLevel: constants.LOG_DEBUG,
  singleRun: false,
  concurrency: Infinity,
  crossOriginAttribute: '*'
}
