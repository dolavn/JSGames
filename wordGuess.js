const games = require('./games');
const users = require('./users');

const ALPHABET = 'אבגדהוזחטיכלמנסעפצקרשת';
const FINITE_LETTERS = 'םףץןך';
const FINITE_DICT = {'מ':'ם',
                     'נ':'ן',
                     'פ':'ף',
                     'צ':'ץ',
                     'כ':'ך'};
const FREE_ALPHABET = ' ?!.,\'';
const HIDDEN_CHAR = 'X';

const NO_WORD = 'עליך להזין את המשפט';
const ILLEGAL_CHAR = 'התו X אינו חוקי';

const MAX_TURNS = 6;

const GAME_STATUS = {
    PLAYING: 'playing',
    WON: 'won',
    LOST: 'lost',
}
const INIT_GAME = {'players': [], 'ready': 0, 'wantNewGame': 0};
const INIT_PLAYER = {'word': '', 'hiddenWord': [], 'socket': null, 'lettersLeft': -1,
                     'clue': '', 'turnsLeft': MAX_TURNS, status: GAME_STATUS.PLAYING};


function emitGameParams(socket){
    socket.emit('gameParams', {alphabet: ALPHABET, hiddenChar: HIDDEN_CHAR,
                              delimeters: FREE_ALPHABET, maxTurns: MAX_TURNS});
}

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
    hiddenLettersNum = 0;
    for(let i=0;i<word.length;++i){
        if(FREE_ALPHABET.includes(word[i])){
            hiddenWord.push(word[i]);
        }else{
            hiddenWord.push(HIDDEN_CHAR);
            hiddenLettersNum++;
        }
    }
    return {'hiddenWord': hiddenWord, 'hiddenLettersNum': hiddenLettersNum};
}

function setWord(gameId, socket, word, clue){
    let players = games.getGame(gameId).players;
    for(let i=0;i<players.length;++i){
        if(players[i].socket == socket){
            players[i].word = word;
            players[i].clue = clue;
            let wordData = getHiddenWord(word);
            players[i].hiddenWord = wordData.hiddenWord;
            players[i].lettersLeft = wordData.hiddenLettersNum;
            return;
        }
    }
}

function initPlayer(socket){
    let player = games.clone(INIT_PLAYER);
    player.socket = socket;
    return player;
}

function getPlayer(gameId, socket){
    let players = games.getGame(gameId).players;
    for(let i=0;i<players.length;++i){
        if(players[i].socket == socket){
            return players[i];
        }
    }
    throw "socket not in game";
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

function isGameFinished(gameId){
    let players = games.getGame(gameId).players;
    for(let i=0;i<players.length;++i){
        if(players[i].status == GAME_STATUS.PLAYING){return false;}
    }
    return true;
}

function getAllOccurrences(string, character){
    let ans = [];
    for(let i=0;i<string.length;++i){
        if(string[i] == character){ans.push(i);}
    }
    return ans;
}

function getQueryAnswer(word, letter){
    queries = [];
    let occurrences = getAllOccurrences(word, letter);  let totalCorrect = 0; 
    let queryData = {'letter': letter, 'occurrences': occurrences};
    queries.push(queryData);
    totalCorrect += occurrences.length;
    if(letter in FINITE_DICT){
        occurrences = getAllOccurrences(word, FINITE_DICT[letter]);
        queryData = {'letter': FINITE_DICT[letter],  'occurrences': occurrences}
        totalCorrect += occurrences.length;
        queries.push(queryData);
    }
    return {'queries': queries, 'totalCorrect': totalCorrect};
}

function updatePlayerStatus(player, otherPlayer, socket, otherSocket){
    if(otherPlayer.lettersLeft==0){
        player.status = GAME_STATUS.WON;
        socket.emit('victory');
        otherSocket.emit('otherVictory', users.getUname(socket));
    }
    if(player.turnsLeft==0){
        player.status = GAME_STATUS.LOST;
        socket.emit('defeat', otherPlayer.word);
        otherSocket.emit('otherDefeat', users.getUname(socket));
    }
}

function resetPlayer(player){
    player.word = '';
    player.hiddenWord = '';
    player.lettersLeft = -1;
    player.turnsLeft = MAX_TURNS;
    player.status = GAME_STATUS.PLAYING;
}

function removeListeners(socket){
    socket.removeAllListeners('word');
    socket.removeAllListeners('newGameYes');
    socket.removeAllListeners('letterChoice');
}

function resetGame(gameId){
    let game = games.getGame(gameId);
    let players = game.players;
    game.wantNewGame++;
    if(game.wantNewGame==2){
        game.wantNewGame = 0;
        game.ready = 0;
        for(let i=0;i<players.length;++i){
            let player = players[i];
            let socket = player.socket;
            socket.emit('resetGame');
            removeListeners(socket);
            resetPlayer(player);
            emitGameParams(socket);
            socket.on('word', (text)=>{handleWord(gameId, socket, text);});
        }
    }
}

function sendNewGameNotification(gameId){
    let players = games.getGame(gameId).players;
    console.log('sending new game');
    for(let i=0;i<players.length;++i){
        let socket = players[i].socket;
        socket.emit('newGame');
        socket.on('newGameYes', ()=>{resetGame(gameId);});
    }
}

function getButtonHandler(gameId, socket){
    let otherPlayer = getOtherPlayer(gameId, socket);
    let otherSocket = otherPlayer.socket;
    let player = getPlayer(gameId, socket);
    return function(letter){
        let word = otherPlayer.word;
        let queryAnswer = getQueryAnswer(word, letter);
        for(let i=0;i<queryAnswer.queries.length;++i){
            socket.emit('queryAnswer', queryAnswer.queries[i]);
            otherSocket.emit('otherQueryAnswer', queryAnswer.queries[i]);
        }
        otherPlayer.lettersLeft = otherPlayer.lettersLeft - queryAnswer.totalCorrect;
        if(queryAnswer.totalCorrect == 0){
            socket.emit('wrong');
            otherSocket.emit('otherWrong');
            player.turnsLeft--;
        }
        updatePlayerStatus(player, otherPlayer, socket, otherSocket);
        if(isGameFinished(gameId)){
            sendNewGameNotification(gameId);
        }
    };
}

function startGame(gameId){
    let players = games.getGame(gameId).players;
    for(var i=0;i<players.length;++i){
        let socket = players[i].socket;
        let otherSocket = players[1-i].socket;
        let otherHiddenWord = players[1-i].hiddenWord;
        let otherClue = players[1-i].clue;
        let yourHiddenWord = players[i].hiddenWord;
        socket.emit('startGame', {'otherHiddenWord': otherHiddenWord,
                                  'otherClue': otherClue,
                                  'otherName': users.getUname(otherSocket),
                                  'yourHiddenWord': yourHiddenWord});
        socket.on('letterChoice', getButtonHandler(gameId, socket));
    }
}

function handleWord(gameId, socket, wordData){
    let game = games.getGame(gameId);
    if(checkInput(socket, wordData.word)){
        let players = game.players;
        if(players.length<2){
            players.push(initPlayer(socket));
        }
        setWord(gameId, socket, wordData.word, wordData.clue);
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
    emitGameParams(socket);
    socket.on('word', (wordData)=>{handleWord(gameInd, socket, wordData);});
}

exports.setupWordGuessGame = setupWordGuessGame;

