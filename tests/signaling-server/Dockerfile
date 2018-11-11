FROM mhart/alpine-node:11

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh

WORKDIR /home

COPY . /home

RUN npm install --prod
RUN npm install -g pm2

CMD ["pm2", "start", "ecosystem.config.js", "--no-daemon"]
