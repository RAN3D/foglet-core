module.exports = {
  mode: 'development',
  entry: './lib/index.js',
  output: {
    'path': require('path').resolve(process.cwd(), './bin'),
    'filename': 'foglet-core.bundle.js',
    'library': 'foglet',
    'libraryTarget': 'umd',
    'umdNamedDefine': true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: (name) => {
          return true
        },
        use: {
          loader: 'babel-loader',
          options: {
            presets: [ 'env' ]
          }
        }
      }
    ]
  },
  devtool: 'source-map'
}
