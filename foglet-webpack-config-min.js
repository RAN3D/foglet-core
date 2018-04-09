const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const lmerge = require('lodash.merge')
const webpackconfig = require('./foglet-webpack-config')
module.exports = lmerge(webpackconfig, {
  output: {
    'filename': 'foglet.bundle.min.js'
  },
  plugins: [new UglifyJSPlugin({
    sourceMap: true
  })]
})
