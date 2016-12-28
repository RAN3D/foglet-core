var path = require('path');
var express = require("express");
var app = express();
var http = require('http').Server(app);
var cors = require('cors');
var io = require("socket.io")(http);
var port = process.env.PORT || 3000;

var number = 0;
var joinningPeer = null;
app.use(cors());

app.use('/static', express.static(__dirname + "/../../"));

app.get('/:name', function(req, res){
  res.sendFile(path.resolve(__dirname+"/../"+req.params.name+"/index.html"));
});

app.get('/', function(req, res){
  res.sendFile(__dirname + "/index.html");
});


io.on('connection', function(socket){
  number++;
  console.log('A user connected - Number of members : '+number);
  socket.on("joinRoom",function(room){
    socket.join(room);
  });

  socket.on("new",function(data){
        var room = data.room;
        var offer = data.offer;
        console.log("**********BEGIN LUNCH EVENT*************");
        //console.log(spray);
        joinningPeer = socket;
        socket.broadcast.in(room).emit("new_spray",offer);
        console.log("**********END LUNCH EVENT*************");
  });

  socket.on("accept",function(data){
    var room = data.room;
    var offer = data.offer;
    console.log("**********BEGIN ACCEPT EVENT*************");
    console.log(offer);
    if(joinningPeer != null){
        joinningPeer.emit("accept_spray",offer);
    }
    joinningPeer = null;
    console.log("**********END ACCEPT EVENT*************");
  });


  socket.on('disconnect', function(){
    console.log('A user disconnected');
    number--;
  });
});

http.listen(port, function () {
  console.log('HTTP Server listening on port '+port);
});
