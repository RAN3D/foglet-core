
var path = require('path');
var express = require('express');
var app = express();
var http = require('http');
var io = require('socket.io');


function init (options) {
  console.log(options);
  app.use('/static', express.static(__dirname + "/"));

  console.log(__dirname);

  app.get('/', function (req, res) {
    res.sendFile(__dirname + "/index.html");
  });

  var httpServer = http.Server(app);
  var ioServer = io(httpServer);
  var port = process.env.PORT || 4000;
  let number = 0;
  let clients = {};


  ioServer.on('connection', function(socket) {
      number++;
      console.log('People: #=' + number);
  });

  httpServer.listen(port, function () {
      console.log('HTTP Server listening on port ' + port);
  });
}

module.exports = { init };
