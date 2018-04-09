const fs = require('fs')
const path = require('path')
const karmaConfig = path.join(__dirname, './../node_modules/foglet-scripts/src/karma/karma-config.js')
const oursignaling = path.join(__dirname, './examples/server-bis.js')

console.log(karmaConfig)
console.log(oursignaling)

const data = fs.readFileSync(karmaConfig, 'utf8')
let result = data.replace(/const signaling = require\('foglet-signaling-server'\)/g, `const signaling = require('${oursignaling}')`)

fs.writeFileSync(karmaConfig, result, 'utf8', function (err) {
  if (err) return console.log(err)
})
