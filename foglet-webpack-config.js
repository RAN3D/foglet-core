module.exports = {
  entry: './foglet-core.js',
  output: {
    'path': require('path').resolve(process.cwd(), 'dist'),
    'filename': 'foglet.bundle.js',
    'library': 'foglet',
    'libraryTarget': 'umd',
    'umdNamedDefine': true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: () => {
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
