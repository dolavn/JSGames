var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const mastermind = require('./mastermind');
const pong = require('./pong');
const users = require('./users');
const games = require('./games');
const { type } = require('os');

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
    users.addUser({'name': user, 'socket': socket, 'gameId': -1, 'gameType': games.GAME_TYPES.NONE})
    users.broadcast('logged_in_users', users.getNames());
  });
  socket.on('gameType', (gameType) => {
      users.setGameType(socket, gameType);
      console.log(gameType, games.GAME_TYPES.MASTERMIND);
      if(gameType == games.GAME_TYPES.MASTERMIND){
        createMasterMindHandlers(socket);
      }
      if(gameType == games.GAME_TYPES.PONG){
        pong.setupPongGame(socket);
      }
  });
  socket.on('chatMessage', (message)=>{
    uname = users.getUname(socket);
    users.broadcast('chatMessage', [uname, message]);
  });
});
