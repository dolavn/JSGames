const games = require('./games');
const users = require('./users');
const INIT_LOCATION = 50;
const X_BOUND = 1200;
const Y_BOUND = 800;
const PLAYER_SPEED = 20;
const PLAYER_WIDTH = 150;
const INIT_BALL_SPEED = [1.41, 1.41];
const INIT_BALL_LOC = [500, 100];
const PLAYER_A_Y = 60;
const PLAYER_B_Y = 740;

function emitGameDataToSocket(game, socket){
    socket.emit('gameData', {'ball': game['ball'], 'locations': game['locations']});
}

function pauseGame(game, socket){
    if(game.paused){return;}
    uname = users.getUname(socket);
    game.paused = true;
    game.pausingPlayer = uname;
    for(let i=0;i<2;++i){
        let sock = game.players[i];
        sock.emit('pause', uname);
    }
}

function unpauseGame(game, socket){
    if(!game.paused){return;}
    uname = users.getUname(socket);
    if(uname!=game.pausingPlayer){return;}
    game.paused = false;
    for(let i=0;i<2;++i){
        let sock = game.players[i];
        sock.emit('unpause', uname);
    }
}

function addPlayerToGame(game, socket){
    game['players'].push(socket);
    game['score'].push(0);
    game['locations'].push(INIT_LOCATION);
    function getMoveFunction(ind, dir){
        return function(){
            if(game.paused){return;}
            newLoc = Math.min(X_BOUND-PLAYER_WIDTH, game['locations'][ind] + PLAYER_SPEED*dir);
            newLoc = Math.max(0, newLoc);
            game['locations'][ind] = newLoc;
        }
    }
    socket.on('right', getMoveFunction(game['locations'].length-1, 1));
    socket.on('left', getMoveFunction(game['locations'].length-1, -1));
    socket.on('pause', ()=>{pauseGame(game, socket);});
    socket.on('unpause', ()=>{unpauseGame(game, socket);});
}

function checkIfGameIsFull(game){return game.players.length==2;}

function scoreGoal(game){
    let ballY = game.ball[1];
    let ind = ballY>Y_BOUND?0:1;
    game.score[ind] = game.score[ind] + 1;
    game.ball = Array.from(INIT_BALL_LOC);
    game.ballSpeed = Array.from(INIT_BALL_SPEED);
    for(let i=0;i<2;++i){
        let socket = game.players[i];
        socket.emit('score', game.score);
    }
}

function getBallNewSpeed(ballLocation, playerX, playerInd){
    let anglesRanges = [[150, 30], [210, 330]];
    let anglesRange = anglesRanges[playerInd]; 
    let minAngle = anglesRange[0]; let maxAngle = anglesRange[1];
    let x = ballLocation[0]; let relativeX = x-playerX;
    let ballAngle = minAngle+relativeX*((maxAngle-minAngle)/PLAYER_WIDTH);
    ballAngle = Math.PI*ballAngle/180;
    return [2*Math.cos(ballAngle), 2*Math.sin(ballAngle)];
}

function checkCollisionWithPlayer(game){
    let ballX = game.ball[0]; let ballY = game.ball[1];
    let yArr = [PLAYER_A_Y, PLAYER_B_Y];
    for(let i=0;i<2;++i){
        let currX = game['locations'][i];
        let currY = yArr[i];
        if(ballX>=currX && ballX<=currX+PLAYER_WIDTH && ballY>=currY-10 && ballY<=currY+10){
            let newSpeed = getBallNewSpeed(game.ball, currX, i);
            game.ballSpeed = Array.from(newSpeed);
        }
    }
}

function checkCollisions(game){
    let ball = game['ball']; let ballX = ball[0]; let ballY = ball[1];
    if(ballX>X_BOUND || ballX<0){
        game.ballSpeed[0] = -game.ballSpeed[0];
    }
    if(ballY > Y_BOUND || ballY < 0){
        scoreGoal(game);
    }
    checkCollisionWithPlayer(game);
}

function moveBall(game){
    game.ball[0] = game.ball[0] + game.ballSpeed[0];
    game.ball[1] = game.ball[1] + game.ballSpeed[1];
}

function mainGameLoop(game){
    if(game['paused']){return;}
    checkCollisions(game);
    moveBall(game);
}

function startGame(game){
    game['ballSpeed'] = Array.from(INIT_BALL_SPEED);
    game['ball'] = Array.from(INIT_BALL_LOC);
    game['paused'] = false;
    let playerNames = [users.getUname(game['players'][0]), users.getUname(game['players'][1])];
    for(let i=0;i<game['players'].length;++i){
        let socket = game['players'][i];
        socket.emit('players', playerNames);
        socket.emit('score', [0, 0]);
        setInterval(()=>{mainGameLoop(game);}, 10);
        setInterval(()=>{emitGameDataToSocket(game, socket);}, 10);
    }
}

function setupPongGame(socket){
    let gameInd = games.findGamePong();
    console.log('putting in game', gameInd);
    users.setGameType(socket, games.GAME_TYPES.PONG);
    users.setGameId(socket, gameInd);
    let game = games.getGame(gameInd);
    addPlayerToGame(game, socket);
    if(checkIfGameIsFull(game)){
        startGame(game);
    }
}

exports.setupPongGame = setupPongGame;
