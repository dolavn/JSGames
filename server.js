var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var url = require('url');
var fs = require('fs');
var events = require('events');
var eventEmitter = new events.EventEmitter();
const { type } = require('os');

let users = [];
let games = [];
const MAX_TURNS = 9;

function compare(code1, code2){
    codeLength = code1.length;
    ordered = 0; unordered = 0; correctIndices1 = []; correctIndices2 = [];
    for(var i=0;i<codeLength;++i){
        if(code1[i] == code2[i]){
            correctIndices1.push(i);
            correctIndices2.push(i);
            ordered++;
        }
    }
    for(var i=0;i<codeLength;++i){
        if(correctIndices1.includes(i)){continue;}
        for(var j=0;j<codeLength;++j){
            if(i==j || correctIndices2.includes(j)){continue;}
            if(code1[i] == code2[j]){
                unordered++;
                correctIndices1.push(i); correctIndices2.push(j);
                break;
            }
        }
     }
    return {'ordered': ordered, 'unordered': unordered};
}

function resetGame(gameId){
    let players = games[gameId]['players'];
    for(let i=0;i<2;++i){
        let socket = players[i]['socket'];
        socket.removeAllListeners('mousePress');
        socket.removeAllListeners('guess');
        socket.removeAllListeners('newGameYes');
        players[i]['turns'] = 0;
    }
    games[gameId]['finished'] = [];
    games[gameId]['ready'] = 0;
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

function checkGameFinished(gameId){
    if(games[gameId]['finished'].length == 2){
        for(let i=0;i<games[gameId]['players'].length;++i){
            let player = games[gameId]['players'][i];
            let socket = player['socket'];   
            socket.emit('gameFinished')
            socket.on('newGameYes', function(){resetGame(gameId);});
        }
    }
}

function getGuessHandler(ind, sock, otherSock){
    return function(code){
        let gameId = getGameId(sock, users);
        let players = games[gameId]['players'];
        let player = players[ind];
        player['turns']++;
        result = compare(code, players[1-ind]['code']);
        if(result['ordered']==code.length){
            games[gameId]['finished'].push(ind);
            sock.emit('victory', getUname(players[ind]['socket'], users));
            otherSock.emit('otherVictory', getUname(players[ind]['socket'], users));
            checkGameFinished(gameId);
        }else{
            if(player['turns']==MAX_TURNS){
                games[gameId]['finished'].push(ind);
                sock.emit('noMoreTurns');
                checkGameFinished(gameId);
            }
        }
        sock.emit('result', result);
        otherSock.emit('otherResult', result);
        console.log('emitting to ' + getUname(otherSock, users));
    };
}

function getMouseHandler(otherSocket){
    return function(params){
        console.log(params);
        otherSocket.emit('mousePress', params);
    };
}

function findGame(){
    for(let i=0;i<games.length;++i){
        let game = games[i]; let players = game['players'];
        if(players.length==2){continue;}
        if(players.length==1){return i;}
    }
    games.push({'players': [], 'finished': [], 'ready': 0});
    return games.length-1;
}

function setGameId(socket, users, gameId){
    for(let i=0;i<users.length;++i){
        let user = users[i];
        if(user['socket'] == socket){
            user['gameId'] = gameId;
            return;
        }
    }
    throw "Wrong socket";
}

function getUser(socket, users){
    for(let i=0;i<users.length;++i){
        let user = users[i];
        if(user['socket'] == socket){
            return user;
        }
    }
    let stack = new Error().stack
    console.log( stack )
    throw "Wrong socket";
}

function getGameId(socket, users){
    return getUser(socket, users)['gameId'];
}

function getUname(socket, users){
    return getUser(socket, users)['name'];
}

function broadcast(users, event, value){
    for(let i=0;i<users.length;++i){
        curr_socket = users[i]['socket'];
        curr_socket.emit(event, value);
    }    
}

function setCode(gameId, code, socket){
    let players = games[gameId]['players'];
    for(let i=0;i<players.length;++i){
        if(players[i]['socket'] == socket){
            players[i]['code'] = code;
            return;
        }
    }
}

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
    names = [];
    for(let i=0;i<users.length;++i){
        if(socket == users[i]['socket']){
            users.splice(i, 1);
            i--;
        }else{
            names.push(users[i]['name']);
        }
    }   
    broadcast(users, 'logged_in_users', names);
  });
  socket.on('uname', (user) => {
    users.push({'name': user, 'socket': socket, 'gameId': -1});
    names = [];
    for(let i=0;i<users.length;++i){
        names.push(users[i]['name']);
    }
    broadcast(users, 'logged_in_users', names);
  });
  socket.on('chatMessage', (message)=>{
        uname = getUname(socket, users);
        broadcast(users, 'chatMessage', [uname, message]);
  });
  socket.on('code', (user) => {
    let gameId = getGameId(socket, users);
    if(gameId==-1){
        gameId = findGame();
    }
    let players = games[gameId]['players'];
    let uname = getUname(socket, users);
    user['uname'] = uname;
    user['turns'] = 0;
    setGameId(socket, users, gameId);
    console.log('user ' + uname + ' was put in game ' + gameId);
    if(players.length<2){
        user['socket'] = socket;
        players.push(user);
    }
    setCode(gameId, user['code'], socket);
    games[gameId]['ready']++;
    if(games[gameId]['ready']==2){
        for(var i=0;i<players.length;++i){
            sock = players[i]['socket'];
            otherSock = players[1-i]['socket'];
            console.log('starting game');
            sock.emit('startGame', players[1-i]['uname']);
            sock.on('mousePress', getMouseHandler(otherSock));
            sock.on('guess', getGuessHandler(i, sock, otherSock));
        }
    }
  });
});

/*
app.get(function (req, res) {
    var q = url.parse(req.url, true);
    if(q.pathname=='/'){
        q.pathname = '/index.html';
    }
    var filename = "." + q.pathname;
    fs.readFile(filename, function(err, data) {
        if (err) {
            res.writeHead(404, {'Content-Type': 'text/html'});
            return res.end("404 Not Found");
        } 
        var type = 'text/html';
        if(q.pathname == '/index.js'){
            type = 'text/javascript';
        }
        res.writeHead(200, {'Content-Type': type});
        res.write(data);
        return res.end();
    });
}).listen(3000);
*/