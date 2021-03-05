const users = require('./users');

const GAME_TYPES = {
	NONE: "none",
	MASTERMIND: "mastermind",
	PONG: "pong",
}

let games = [];

function findGame(gameType){
    for(let i=0;i<games.length;++i){
        let game = games[i]; let players = game['players'];
        if(game['type'] != gameType){
            continue;
        }
        if(players.length==2){continue;}
        if(players.length==1){return i;}
    }
    return -1;
}

function findGameMastermind(){
    let gameInd = findGame(GAME_TYPES.MASTERMIND);
    if(gameInd==-1){
        games.push({'players': [], 'finished': [], 'ready': 0, 'type': GAME_TYPES.MASTERMIND});
        return games.length-1;
    }
    return gameInd;
}

function findGamePong(){
    let gameInd = findGame(GAME_TYPES.PONG);
    if(gameInd==-1){
        games.push({'players': [], 'score': [], 'ball': [100, 100], 'ball_speed': [0, 0], 'paused': true,
                    'pausingPlayer': null, 'locations': [], 'type': GAME_TYPES.PONG});
        return games.length-1;
    }
    return gameInd;  
}

function getGame(gameId){
    return games[gameId];
}

exports.findGamePong = findGamePong;
exports.findGameMastermind = findGameMastermind;
exports.getGame = getGame;
exports.GAME_TYPES = GAME_TYPES;