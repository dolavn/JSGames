import {showPopup} from './index.js';

const BG_COLOR = '#001122';
const FORECOLOR = '#aaaaaa';
const SCORE_X = 1000;
const SCORE_Y = 24;
const SCORE_SIZE = 16;
const MESSAGE_SIZE = 32;
const MESSAGE_X = 600;
const MESSAGE_Y = 400;
const RIGHT_DIR = 1;
const LEFT_DIR = -1;

const GAME_PAUSED = "עצר את המשחק";
const WAITING_FOR_OTHER_PLAYER = "ממתין לשחקן נוסף";
const DISCONNECTED = "התנתק";

let ctx;
let socket;

let players = ['', ''];
let score = [0, 0];
let ballLocation = [0, 0];
let ballSpeed = [0, 0];
let playerALoc = 0;
let playerBLoc = 0;
let message = "";
let paused = false;
let playerInd = -1;
let xBound, yBound, playerAY, playerBY, playerWidth, playerHeight, playerSpeed, ballRadius, loopInterval;

function initCanvasPong(gameScreen){
    ctx = gameScreen.getContext();    
    gameScreen.setWidth(xBound);
    gameScreen.setHeight(yBound);
}

function drawMessage(){
    if(message!=""){
        ctx.font = MESSAGE_SIZE + "px Arial";
        ctx.fillStyle = FORECOLOR;
        ctx.fillText(message, MESSAGE_X, MESSAGE_Y); 
    }
}

function drawScore(){
    if(players[0]==""){return;}
    ctx.font = SCORE_SIZE + "px Arial";
    ctx.fillStyle = FORECOLOR;
    ctx.fillText(players[0] + ' - ' + score[0], SCORE_X, SCORE_Y); 
    ctx.fillText(players[1] + ' - ' + score[1], SCORE_X, SCORE_Y+(1.5*SCORE_SIZE)); 
}

function printMessage(text){
    message = text;
}

function removeMessage(){message="";}

function drawBoard(){
    ctx.clearRect(0, 0, xBound, yBound);
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, xBound, yBound);
    ctx.fillStyle = FORECOLOR;
    ctx.fillRect(playerALoc, playerAY, playerWidth, playerHeight);
    ctx.fillRect(playerBLoc, playerBY, playerWidth, playerHeight);
    let circle = new Path2D();
    circle.arc(ballLocation[0], ballLocation[1], ballRadius, 0, 2 * Math.PI, false);
    ctx.fill(circle);
    drawMessage();
    drawScore();
}

function movePlayer(direction){
    function move(direction, oldValue){
        let newValue = oldValue + direction*playerSpeed;
        newValue = Math.max(0, newValue);
        newValue = Math.min(xBound, newValue);
        return newValue;
    }
    if(playerInd==0){
        playerALoc = move(direction, playerALoc);
    }else{
        playerBLoc = move(direction, playerBLoc);
    }
}

function initListeners(){
    document.addEventListener('keydown', (e)=>{
        if(e.code == "ArrowLeft"){
            movePlayer(LEFT_DIR);
            socket.emit('left');
        }
        if(e.code == "ArrowRight"){
            movePlayer(RIGHT_DIR);
            socket.emit('right');
        }
        if(e.code == "Escape"){
            if(!paused){
                socket.emit('pause');
            }else{
                socket.emit('unpause');
            }
        }
    });
}

function moveBall(){
    ballLocation = [ballLocation[0] + ballSpeed[0], ballLocation[1] + ballSpeed[1]];
}

function updateGame(playerA, playerB, ballX, ballY, ballSpeedX, ballSpeedY){
    playerALoc = playerA;
    playerBLoc = playerB;
    ballLocation = [ballX, ballY];
    ballSpeed = [ballSpeedX, ballSpeedY];
}

function initConstants(constants){
    xBound = constants.xBound; yBound = constants.yBound;
    playerAY = constants.playerAY; playerBY = constants.playerBY;
    playerWidth = constants.playerWidth; playerHeight = constants.playerHeight;
    playerSpeed = constants.playerSpeed; ballRadius = constants.ballRadius; 
    loopInterval = constants.loopInterval;
}

export function initPong(sock, gameScreenService, modalsService){
    socket = sock;
    socket.emit('gameType', 'pong');  
    let sendButton = document.getElementById('sendButton');
    sendButton.style.display = "none";
    socket.on('gameConstants', (constants)=>{
        initConstants(constants);
        initCanvasPong(gameScreenService);
        initListeners();
        printMessage(WAITING_FOR_OTHER_PLAYER);
        drawBoard();
    });
    socket.on('gameData', (data)=>{updateGame(data.locations[0], data.locations[1],
                                              data.ball[0], data.ball[1],
                                              data.ballSpeed[0], data.ballSpeed[1])});
    socket.on('playerInd', (ind)=>{playerInd = ind;})
    socket.on('players', (names)=>{players=names;});
    socket.on('score', (result)=>{score=result;})
    socket.on('pause', (player)=>{paused=true;printMessage(player + ' ' + GAME_PAUSED);});
    socket.on('unpause', (player)=>{paused=false;removeMessage();});
    socket.on('gameStarted', ()=>{
        setInterval(()=>{
            if(!paused){
                //moveBall();
            }
            drawBoard();
        }, loopInterval);
        removeMessage();
    });
    socket.on('disconnection', (uname)=>showPopup(uname + " " + DISCONNECTED))
}