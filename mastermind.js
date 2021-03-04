const games = require('./games');
const users = require('./users');

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
    let players = games.getGame(gameId)['players'];
    for(let i=0;i<2;++i){
        let socket = players[i]['socket'];
        socket.removeAllListeners('mousePress');
        socket.removeAllListeners('guess');
        socket.removeAllListeners('newGameYes');
        players[i]['turns'] = 0;
    }
    games.getGame(gameId)['finished'] = [];
    games.getGame(gameId)['ready'] = 0;
}

function checkGameFinished(gameId){
    if(games.getGame(gameId)['finished'].length == 2){
        for(let i=0;i<games.getGame(gameId)['players'].length;++i){
            let player = games.getGame(gameId)['players'][i];
            let socket = player['socket'];   
            socket.emit('gameFinished')
            socket.on('newGameYes', function(){resetGame(gameId);});
        }
    }
}

function getGuessHandler(ind, sock, otherSock){
    return function(code){
        let gameId = users.getGameId(sock);
        let players = games.getGame(gameId)['players'];
        let player = players[ind];
        player['turns']++;
        result = compare(code, players[1-ind]['code']);
        if(result['ordered']==code.length){
            games.getGame(gameId)['finished'].push(ind);
            sock.emit('victory', users.getUname(players[ind]['socket']));
            otherSock.emit('otherVictory', users.getUname(players[ind]['socket']));
            checkGameFinished(gameId);
        }else{
            if(player['turns']==MAX_TURNS){
                games.getGame(gameId)['finished'].push(ind);
                sock.emit('noMoreTurns');
                checkGameFinished(gameId);
            }
        }
        sock.emit('result', result);
        otherSock.emit('otherResult', result);
        console.log('emitting to ' + users.getUname(otherSock));
    };
}

function getMouseHandler(otherSocket){
    return function(params){
        console.log(params);
        otherSocket.emit('mousePress', params);
    };
}

function setCode(gameId, code, socket){
    let players = games.getGame(gameId)['players'];
    for(let i=0;i<players.length;++i){
        if(players[i]['socket'] == socket){
            players[i]['code'] = code;
            return;
        }
    }
}

function startMasterMindGame(gameId){
    let players = games.getGame(gameId)['players'];
    for(var i=0;i<players.length;++i){
        sock = players[i]['socket'];
        otherSock = players[1-i]['socket'];
        console.log('starting game');
        sock.emit('startGame', players[1-i]['uname']);
        sock.on('mousePress', getMouseHandler(otherSock));
        sock.on('guess', getGuessHandler(i, sock, otherSock));
    }
}

exports.setCode = setCode;
exports.startMasterMindGame = startMasterMindGame;
exports.getMouseHandler = getMouseHandler;
exports.getGuessHandler = getGuessHandler;
exports.checkGameFinished = checkGameFinished;
exports.resetGame = resetGame;
exports.compare = compare;