const users = require('./users');

const MAX_PLAYERS_IN_GAME = 2;
const GAME_TYPES = {
	NONE: "none",
	MASTERMIND: "mastermind",
	PONG: "pong",
    WORD_GUESS: "wordGuess",
}

let games = [];

function clone(a) {
    return JSON.parse(JSON.stringify(a));
 }

function findGame(gameType){
    for(let i=0;i<games.length;++i){
        //todo: perhaps change to sockets?
        let game = games[i]; let players = game.players; 
        if(game['type'] != gameType){
            continue;
        }
        if(players.length==2){continue;}
        if(players.length==1){return i;}
    }
    return -1;
}

function findGamePublic(gameType, args, socket, disconnectionHandler){
    let gameInd = findGame(gameType);
    if(gameInd==-1){
        game = Object.assign({}, args);
        game['disconnectionHandler'] = disconnectionHandler;
        game['type'] = gameType;
        game['sockets'] = [socket];
        game['max_players'] = MAX_PLAYERS_IN_GAME;
        games.push(game);
        return games.length-1;
    }
    getGame(gameInd).sockets.push(socket);
    return gameInd;  
}

function getGame(gameId){
    return games[gameId];
}

function getSocketInd(gameId, socket){
    let game = getGame(gameId);
    for(let i=0;i<game.sockets.length;++i){
        if(socket==game.sockets[i]){
            return i;
        }
    }
    throw "Socket not found";
}

function removeSocket(gameId, socketId){
    let game = getGame(gameId);
    game.sockets.splice(socketId, 1);
}

function handleDisconnect(gameId, socket){
    let game = getGame(gameId);
    let socketId = getSocketInd(gameId, socket);
    removeSocket(gameId, socketId);
    game.disconnectionHandler(gameId, socket);
}

exports.findGame = findGamePublic;
exports.getGame = getGame;
exports.handleDisconnect = handleDisconnect;
exports.clone = clone;
exports.GAME_TYPES = GAME_TYPES;