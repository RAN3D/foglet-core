const entries = {}
// const fs = require('fs')
// read folders recursively in lib/plugins, foreach folder with index.js add an entry.
const fs = require('fs')
const path = require('path')
// List all files in a directory in Node.js recursively in a synchronous fashion
const walkSync = function (dir, filelist = []) {
  let files = fs.readdirSync(dir)
  filelist = filelist || []
  files.forEach(function (file) {
    if (fs.statSync(dir + '/' + file).isDirectory()) {
      filelist = walkSync(dir + '/' + file, filelist)
    } else {
      if (file === 'index.js') {
        filelist.push({
          source: path.basename(dir),
          dest: `${dir}/${file}`
        })
      }
    }
  })
  return filelist
}
// list all plugins
const list = walkSync('./lib/plugins')
list.forEach(elem => {
  entries[elem.source] = elem.dest
})
entries['core'] = './lib/index.js'
entries.list = Object.keys(entries)

fs.writeFileSync(require('path').resolve(process.cwd(), './bin/plugins-list.json'), JSON.stringify(entries, null, '\t'))
delete entries.list
// exports
module.exports = {
  mode: 'development',
  entry: entries,
  output: {
    'path': require('path').resolve(process.cwd(), './bin/debug'),
    'filename': '[name].bundle.js',
    'library': 'foglet.[name]',
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
