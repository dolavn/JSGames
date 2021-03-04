var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const mastermind = require('./mastermind');
const users = require('./users');
const { type } = require('os');

const GAME_TYPES = {
	NONE: "none",
	MASTERMIND: "mastermind",
	PONG: "pong",
}

function createMasterMindHandlers(socket){
    console.log('creating handlers');
    socket.on('code', (user) => {
        mastermind.onCodeSubmitHandler(socket, user);
    });
}

app.use('/css', (req,res)=>{
    res.sendFile(req.originalUrl, {root: './'});
});

app.use('/client', express.static(__dirname + '/client'));

app.get('/', function(req, res) {
    res.sendFile("index.html",{ root: './' });
 });
 
http.listen(3000, () => {
    console.log('listening on *:3000');
  });

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
    users.removeUser('socket', socket);
    users.broadcast('logged_in_users', users.getNames());
  });
  socket.on('uname', (user) => {
    users.addUser({'name': user, 'socket': socket, 'gameId': -1, 'gameType': GAME_TYPES.NONE})
    users.broadcast('logged_in_users', users.getNames());
  });
  socket.on('gameType', (gameType) => {
      users.setGameType(socket, gameType);
      console.log(gameType, GAME_TYPES.MASTERMIND);
      if(gameType == GAME_TYPES.MASTERMIND){
        createMasterMindHandlers(socket);
      }
  });
  socket.on('chatMessage', (message)=>{
    uname = users.getUname(socket);
    users.broadcast('chatMessage', [uname, message]);
  });
});
