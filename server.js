var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var url = require('url');
var fs = require('fs');
const mastermind = require('./mastermind');
const games = require('./games');
const users = require('./users');
var events = require('events');
var eventEmitter = new events.EventEmitter();
const { type } = require('os');

const gameType = {
	NONE: "none",
	MASTERMIND: "mastermind",
	PONG: "pong",
}

app.use('/css', (req,res)=>{
    res.sendFile(req.originalUrl, {root: './'});
});

app.use('/js', express.static(__dirname + '/js'));

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
    users.addUser({'name': user, 'socket': socket, 'gameId': -1, 'gameType': gameType.NONE})
    users.broadcast('logged_in_users', users.getNames());
  });
  socket.on('gameType', (gameType) => {
      users.setGameType(socket, gameType);
  });
  socket.on('chatMessage', (message)=>{
        uname = users.getUname(socket);
        users.broadcast('chatMessage', [uname, message]);
  });
  //MM
  socket.on('code', (user) => {
    let gameId = users.getGameId(socket);
    if(gameId==-1){
        gameId = games.findGame();
    }
    let players = games.getGame(gameId)['players'];
    let uname = users.getUname(socket);
    user['uname'] = uname;
    user['turns'] = 0;
    users.setGameId(socket, gameId);
    console.log('user ' + uname + ' was put in game ' + gameId);
    if(players.length<2){
        user['socket'] = socket;
        players.push(user);
    }
    mastermind.setCode(gameId, user['code'], socket);
    games.getGame(gameId)['ready']++;
    if(games.getGame(gameId)['ready']==2){
        mastermind.startMasterMindGame(gameId);
    }
  });
});
