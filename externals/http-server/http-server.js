var path = require('path');
var express = require("express");
var app = express();
var http = require('http').Server(app);
var io = require("socket.io")(http);
var port = process.env.PORT || 3000;

var number = 0;
var joinningPeer = null;

app.use('/static', express.static(__dirname + "/../../"));

app.get('/:name', function(req, res){
  res.sendFile(path.resolve(__dirname+"/../"+req.params.name+"/index.html"));
});

app.get('/', function(req, res){
  res.sendFile(__dirname + "/index.html");
});

let clients = {};

io.on('connection', function(socket){
  number++;
  console.log('A user connected - Number of members : '+number);
  //log.info('A user is connected');
  socket.on("joinRoom",function(room){
    //log.info('A user join the room : ' + room);
    //log.info(socket.id);
    socket.join(room);
  });
  socket.on("new",function(data){
        console.log("**********BEGIN LUNCH EVENT*************");
        let room = data.room;
        let offer = data.offer;
        joinningPeer = socket;
        clients[socket.id] = socket ;
        //console.log("Emit the new offer on the room " + room + " for the socketId : " + socket.id);
        socket.broadcast.in(room).emit("new_spray", offer, socket.id);
        console.log("**********END LUNCH EVENT*************");
  });
  socket.on("accept", function(data, socketId){
    let room = data.room;
    let offer = data.offer;

    //console.log("Server received an accepted ticket for " + socketId);
    if(clients[socketId] != null){
      console.log("**********BEGIN ACCEPT EVENT*************");
      console.log(offer);
      joinningPeer.emit("accept_spray", offer, socket.id);
      console.log("**********END ACCEPT EVENT*************");
    }
  });

  socket.on('connected', (id, socketId) => {
    console.log("========= CONNECTED =========");
    let joinningPeer = clients[socketId];
    if(joinningPeer != null){
        joinningPeer.emit( "connected", id);
    }
  });

  socket.on('disconnect', function(room, socketId){
    console.log('A user disconnected');
    socket.leave(room);
    number--;
  });

});

http.listen(port, function () {
  console.log('HTTP Server listening on port '+port);
});
