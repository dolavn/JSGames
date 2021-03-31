const games = require('./games');
const users = require('./users');

const ALPHABET = 'אבגדהוזחטיכלמנסעפצקרשת';
const FINITE_LETTERS = 'םףץןך';
const FINITE_DICT = {'מ':'ם',
                     'נ':'ן',
                     'פ':'ף',
                     'צ':'ץ',
                     'כ':'ך'};
const FREE_ALPHABET = ' ?!.,';
const HIDDEN_CHAR = 'X';

const NO_WORD = 'עליך להזין את המשפט';
const ILLEGAL_CHAR = 'התו X אינו חוקי';

const INIT_GAME = {'players': [], 'ready': 0};
const INIT_PLAYER = {'word': '', 'hiddenWord': [], 'socket': null};


function checkInput(socket, text){
    if(text==""){socket.emit('error', NO_WORD);return false;}
    for(let i=0;i<text.length;++i){
        let validAlphabets = [ALPHABET, FREE_ALPHABET, FINITE_LETTERS];
        let validLetter = false;
        validAlphabets.forEach(function(alphabet){
            if(alphabet.includes(text[i])){
                validLetter = true;
            }
        });
        if(!validLetter){
            socket.emit('error', ILLEGAL_CHAR.replace('X', text[i]));
            return false;
        }
    }
    socket.emit('accept');
    return true;
};

function getHiddenWord(word){
    hiddenWord = [];
    for(let i=0;i<word.length;++i){
        if(FREE_ALPHABET.includes(word[i])){
            hiddenWord.push(word[i]);
        }else{
            hiddenWord.push(HIDDEN_CHAR);
        }
    }
    return hiddenWord;
}

function setWord(gameId, socket, word){
    let players = games.getGame(gameId).players;
    for(let i=0;i<players.length;++i){
        if(players[i].socket == socket){
            players[i].word = word;
            players[i].hiddenWord = getHiddenWord(word);
            return;
        }
    }
}

function initPlayer(socket){
    let player = games.clone(INIT_PLAYER);
    player.socket = socket;
    return player;
}

function getOtherPlayer(gameId, socket){
    let players = games.getGame(gameId).players;
    for(let i=0;i<players.length;++i){
        if(players[i].socket == socket){
            return players[1-i];
        }
    }
    throw "socket not in game";
}

function getButtonHandler(gameId, socket){
    let otherPlayer = getOtherPlayer(gameId, socket);
    return function(letter){

    };
}

function startGame(gameId){
    let players = games.getGame(gameId).players;
    for(var i=0;i<players.length;++i){
        let socket = players[i].socket;
        let otherSocket = players[1-i].socket;
        let otherHiddenWord = players[1-i].hiddenWord;
        socket.emit('startGame', {'hiddenWord': otherHiddenWord});
        socket.on('buttonPress', getButtonHandler(gameId, socket));
    }
}

function handleWord(gameId, socket, word){
    let game = games.getGame(gameId);
    if(checkInput(socket, word)){
        let players = game.players;
        if(players.length<2){
            players.push(initPlayer(socket));
        }
        setWord(gameId, socket, word);
        game.ready++;
        if(game.ready==2){
            startGame(gameId);
        }
    }
}

function setupWordGuessGame(socket){
    let gameInd = games.findGame(games.GAME_TYPES.WORD_GUESS, games.clone(INIT_GAME),
                                 socket, ()=>{});
    console.log('putting in game', gameInd);
    users.setGameId(socket, gameInd);
    socket.emit('gameParams', {alphabet: ALPHABET, hiddenChar: HIDDEN_CHAR});
    socket.on('word', (text)=>{handleWord(gameInd, socket, text);});
}

exports.setupWordGuessGame = setupWordGuessGame;

