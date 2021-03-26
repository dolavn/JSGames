const { NOTIMP } = require('dns');
const games = require('./games');
const users = require('./users');
const INIT_LOCATION = 50;
const X_BOUND = 1200;
const Y_BOUND = 800;
const PLAYER_SPEED = 20;
const PLAYER_WIDTH = 150;
const PLAYER_HEIGHT = 10;
const BALL_SPEED = 1;
const INIT_BALL_Y = Y_BOUND/2;
const PLAYER_A_Y = 60;
const PLAYER_B_Y = 740;
const LOOP_INTERVAL = 5;
const BALL_RADIUS = 10;

const INIT_GAME = {'players': [], 'score': [], 'ball': [100, 100], 'ball_speed': [0, 0],
 'paused': true, 'pausingPlayer': null, 'locations': []}

function handleDisconnect(gameId, disconnectedSocket){
    let uname = users.getUname(disconnectedSocket);
    let game = games.getGame(gameId); let sockets = game.sockets;
    game.paused = true;
    game.pausingPlayer = null;
    for(let i=0;i<sockets.length;++i){
        sockets[i].emit('disconnection', uname);
    }
}

function emitGameDataToSocket(game, socket){
    socket.emit('gameData', {'ball': game.ball, 'locations': game.locations,
                             'ballSpeed': game.ballSpeed});
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
            emitGameDataToSockets(game);
        }
    }
    socket.on('right', getMoveFunction(game['locations'].length-1, 1));
    socket.on('left', getMoveFunction(game['locations'].length-1, -1));
    socket.on('pause', ()=>{pauseGame(game, socket);});
    socket.on('unpause', ()=>{unpauseGame(game, socket);});
}

function checkIfGameIsFull(game){return game.players.length==2;}


function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomSpeed(){
    let dir = getRandomInt(0, 1);
    let angle = getRandomInt(30, 120);
    angle = angle + dir*180;
    angle = (Math.PI*angle)/180;
    return [BALL_SPEED*Math.cos(angle), BALL_SPEED*Math.sin(angle)];
}

function generateRandomLocation(){
    let x = getRandomInt(0, X_BOUND);
    return [x, INIT_BALL_Y];
}

function scoreGoal(game){
    let ballY = game.ball[1];
    let ind = ballY>Y_BOUND?0:1;
    game.score[ind] = game.score[ind] + 1;
    game.ball = generateRandomLocation();
    game.ballSpeed = generateRandomSpeed();
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
    return [BALL_SPEED*Math.cos(ballAngle), BALL_SPEED*Math.sin(ballAngle)];
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
            return true;
        }
    }
    return false;
}

function checkCollisions(game){
    let ball = game['ball']; let ballX = ball[0]; let ballY = ball[1];
    if(ballX>X_BOUND || ballX<0){
        game.ballSpeed[0] = -game.ballSpeed[0];
        return true;
    }
    if(ballY > Y_BOUND || ballY < 0){
        scoreGoal(game);
        return true;
    }
    return checkCollisionWithPlayer(game);
}

function moveBall(game){
    game.ball[0] = game.ball[0] + game.ballSpeed[0];
    game.ball[1] = game.ball[1] + game.ballSpeed[1];
}

function emitGameDataToSockets(game){
    for(let i=0;i<game.players.length;++i){
        let socket = game.players[i];
        emitGameDataToSocket(game, socket);
    }
}

function mainGameLoop(game){
    if(game.paused){return;}
    if(checkCollisions(game)){
        emitGameDataToSockets(game);
    }
    moveBall(game);
}

function startGame(game){
    game['ballSpeed'] = generateRandomSpeed();
    game['ball'] = generateRandomLocation();
    game['paused'] = false;
    let playerNames = [users.getUname(game['players'][0]), users.getUname(game['players'][1])];
    for(let i=0;i<game['players'].length;++i){
        let socket = game['players'][i];
        socket.emit('gameStarted');
        socket.emit('playerInd', i);
        socket.emit('players', playerNames);
        socket.emit('score', [0, 0]);
        setInterval(()=>{mainGameLoop(game);}, LOOP_INTERVAL);
        setInterval(()=>{emitGameDataToSocket(game, socket);}, 4*LOOP_INTERVAL);
    }
}

function setupPongGame(socket){
    let gameInd = games.findGame(games.GAME_TYPES.PONG, INIT_GAME, socket, handleDisconnect);
    console.log('putting in game', gameInd);
    users.setGameId(socket, gameInd);
    let game = games.getGame(gameInd);
    addPlayerToGame(game, socket);
    let gameConstants = {xBound: X_BOUND, yBound: Y_BOUND, playerAY: PLAYER_A_Y,
        playerBY: PLAYER_B_Y, playerWidth: PLAYER_WIDTH, playerSpeed: PLAYER_SPEED,
        playerHeight: PLAYER_HEIGHT, ballRadius: BALL_RADIUS, loopInterval: LOOP_INTERVAL};
    socket.emit('gameConstants', gameConstants);
    if(checkIfGameIsFull(game)){
        startGame(game);
    }
}

exports.setupPongGame = setupPongGame;
