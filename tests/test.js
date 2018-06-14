const { spawn } = require('child_process')
const path = require('path')

function test () {
  return new Promise((resolve, reject) => {
    const child = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['run', 'test-mocha'])
    child.stdout.on('data', (data) => {
      console.log(`[TEST]: ${data}`)
    })
    child.stderr.on('data', (data) => {
      console.log(`[TEST]: ${data}`)
    })
    child.on('close', (code) => {
      console.log(`[TEST] exited with code ${code}`)
      resolve(code)
    })
  })
}

function signaling () {
  return new Promise((resolve, reject) => {
    const ss = spawn('node', [path.join(__dirname, './examples/server.js')])
    ss.stdout.on('data', (data) => {
      resolve(ss)
      console.log(`[SS]  ${data}`)
    })
    ss.stderr.on('data', (data) => {
      console.log(`[SS]: ${data}`)
    })
    ss.on('close', (code) => {
      console.log(`[SS] Signaling server exited with code ${code}`)
    })
  })
}

function main () {
  return new Promise((resolve, reject) => {
    signaling().then((ss) => {
      test(test).then((test) => {
        kill(ss)
        if (test === 1) throw new Error('Npm tests failed.')
      }).catch(e => {
        reject(e)
      })
    }).catch(e => {
      reject(e)
    })
  })
}

main().then(() => {
  console.log('Test finished.')
  process.exit(0)
}).catch(e => {
  console.error(e)
  process.exit(1)
})

function kill (proc) {
  proc.kill()
}
