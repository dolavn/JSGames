const users = require('./users');

let games = [];

function findGame(){
    for(let i=0;i<games.length;++i){
        let game = games[i]; let players = game['players'];
        if(players.length==2){continue;}
        if(players.length==1){return i;}
    }
    games.push({'players': [], 'finished': [], 'ready': 0});
    return games.length-1;
}

function getGame(gameId){
    return games[gameId];
}

exports.findGame = findGame;
exports.getGame = getGame;