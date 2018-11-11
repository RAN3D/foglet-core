## Build
```bash
docker build -t signaling .
```

## Run

On other devices: Only the API is working
```bash
docker run -d -p 5000:5000 --name signaling -e "PORT=5000" -e "HOST=localhost" signaling
```

On linux devices running docker (signaling server + stun/turn):

```bash
docker run -d --network host --name signaling -e "PORT=5000" -e "HOST=localhost" signaling
```

## Deploy

* Do not use Heroku, no UDP port mappings allowed. Only HTTP(s)

We use Heroku only for the signaling server and ices using the Twilio's Stun/turn provider.

**heroku.yaml**
```yaml
build:
  docker:
    web: Dockerfile
run:
  web: STUN=false PORT=$PORT HOST=signaling-v2.herokuapp.com pm2 start
```

Open now http://signaling-v2.herokuapp.com/twilioice **(please use your own twilio configuration in production mode)**

You will receive something like this:
**response**
```json
{
  "information": "...",
  "iceServers": [{
    "urls": ["stun:<twlio_address>"]
    }, {
      "urls": ["turn:<twlio_address>"],
      "username": "<twlio_api_key>",
      "credential": "<twilio_secret_key>"
  }, ...]
}
```

Do not use http://signaling-v2.herokuapp.com/localice it will not work as Heroku do not allow requests other than http(s) to the port specified by their system in `$PORT`
Moreover the stun/turn server is not activated `STUN=false`

## (Local testing) NodeJs usage using PM2

```bash
# install pm2
npm install -g pm2
```

```bash
cd ./tests/signaling-server && npm install
pm2 start # it will use the ecosystem to run the api and Stun/turn server locally
# if not specified as ENV variable
# STUN=<Boolean> PORT=<Number> HOST=<String> pm2 start,  
```

Open now:
- http://localhost:5000/localice
- http://localhost:5000/twilioice (please use your own twilio configuration)

**response**
```json
{
  "information": "...",
  "iceServers": [{
    "urls": ["stun:localhost:5000"]
    }, {
      "urls": ["turn:localhost:5000?transport=udp"],
      "username": "username",
      "credential": "password"
  }]
}
```

## Default environment variables
```env
STUN=true
PORT=5000
HOST=localhost
```
