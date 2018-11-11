const HOST = process.env.HOST || "localhost"
console.log('HOST: ' , HOST)
const PORT = process.env.PORT || 5000
console.log('PORT: ',  PORT)
console.log(process.env.STUN, typeof process.env.STUN)
const stun = (process.env.STUN === "true")?true:false
console.log('Stun/Turn activated: ', stun)

const apps = []

// push the api
apps.push({
  name: 'signaling-server',
  script: 'api.js',
  instances: 1,
  autorestart: true,
  watch: false,
  max_memory_restart: '1G',
  env: {
    NODE_ENV: 'development',
    PORT,
    HOST
  },
  env_production: {
    NODE_ENV: 'production',
    PORT,
    HOST
  }
})

if (stun) {
  apps.push({
    name: 'stun-turn',
    script: 'stunturn.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT,
      HOST
    },
    env_production: {
      NODE_ENV: 'production',
      PORT,
      HOST
    }
  })
}


module.exports = {
  apps
};
