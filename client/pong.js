import {showPopup} from './index.js';

const PLAYER_A_Y = 60;
const PLAYER_B_Y = 740;
const BG_COLOR = '#001122';
const FORECOLOR = '#aaaaaa';
const PLAYER_HEIGHT = 10
const PLAYER_WIDTH = 150;
const BALL_RADIUS = 10;
const canvasHeight = 800;
const canvasWidth = 1200;
const SCORE_X = 1000;
const SCORE_Y = 24;
const SCORE_SIZE = 16;
const MESSAGE_SIZE = 32;
const MESSAGE_X = 600;
const MESSAGE_Y = 400;

const GAME_PAUSED = "עצר את המשחק";

let canvas,ctx;
let socket;

let players = ['a', 'a'];
let score = [0, 0];
let message = "";
let paused = false;

function initCanvasPong(){
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');    
    canvas.height = canvasHeight; canvas.width = canvasWidth;
}

function incScorePlayer(){playerScore++;}

function incOpponetScore(){opponetScore++;}

function setPlayerName(name){playerName = name;}

function setOpponetName(name){opponetName = name;}

function drawScore(){
    ctx.font = SCORE_SIZE + "px Arial";
    ctx.fillStyle = FORECOLOR;
    ctx.fillText(players[0] + ' - ' + score[0], SCORE_X, SCORE_Y); 
    ctx.fillText(players[1] + ' - ' + score[1], SCORE_X, SCORE_Y+(1.5*SCORE_SIZE)); 
    if(message!=""){
        ctx.font = MESSAGE_SIZE + "px Arial";
        ctx.fillStyle = FORECOLOR;
        ctx.fillText(message, MESSAGE_X, MESSAGE_Y); 
    }
}

function printMessage(text){
    message = text;
}

function removeMessage(){message="";}

function drawBoard(playerAX, playerBX, ballX, ballY){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = FORECOLOR;
    ctx.fillRect(playerAX, PLAYER_A_Y, PLAYER_WIDTH, PLAYER_HEIGHT);
    ctx.fillRect(playerBX, PLAYER_B_Y, PLAYER_WIDTH, PLAYER_HEIGHT);
    let circle = new Path2D();
    circle.arc(ballX, ballY, BALL_RADIUS, 0, 2 * Math.PI, false);
    ctx.fill(circle);
    drawScore();
}

function initListeners(){
    document.addEventListener('keydown', (e)=>{
        if(e.code == "ArrowLeft"){
            socket.emit('left');
        }
        if(e.code == "ArrowRight"){
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

export function initPong(sock){
    socket = sock;
    socket.emit('gameType', 'pong');  
    let sendButton = document.getElementById('sendButton');
    sendButton.style.display = "none";
    initCanvasPong();
    initListeners();
    socket.on('gameData', (data)=>{drawBoard(data['locations'][0], data['locations'][1],
                                             data['ball'][0], data['ball'][1])});
    socket.on('players', (names)=>{players=names;});
    socket.on('score', (result)=>{score=result;})
    socket.on('pause', (player)=>{paused=true;printMessage(player + ' ' + GAME_PAUSED);});
    socket.on('unpause', (player)=>{paused=false;removeMessage();});
    drawBoard(5, 5, 100, 100);
}