import {showPopup} from './index.js';

const colors = [{name:'red', hexCode: '#c20003'},
                {name:'blue', hexCode: '#0400ff'},
                {name:'green', hexCode: '#129e00'},
                {name:'cyan', hexCode: '#00a6ff'},
                {name:'orange', hexCode: '#ff8c00'},
                {name:'purple', hexCode: '#9500ff'}]

var rects = [];
var labels = [];
var lines = {};
var gameStarted = false;
let canvas, ctx;
let socket;

const canvasHeight = 800;
const canvasWidth = 1200;
const rectSize = 50;
const selectionRect = 80;
const rectMargin = 10;
const selectionY = rectMargin;
const selectionX = canvasWidth-selectionRect-rectMargin;
const bgColor = '#ccc8c8';
const emptyColor = '#dddddd';
const orderedColor = '#111122';
const unorderedColor = '#ffffff';
let selectedColor = -1;
let selectionRectInd, sendButton,enterCodeLabelInd, otherPlayerLabelInd;
const CHOOSE_CODE_TXT = 'בחר את הקוד';
const WRONG_CODE_TXT = 'יש להזין את כל חלקי הקוד';
const GUESS_CODE_TXT = 'הזן את הניחוש';
const VICTORY_TXT = 'כל הכבוד ניצחת!';
const WON_TXT = 'ניצח!';
const NO_MORE_TURNS_TXT = 'לא נותרו עוד תורות!';
const WAITING_FOR_PLAYER_TXT = 'ממתין לשחקן נוסף';

const codeLength = 4;
const linesNum = 10;
const yLineInit = (5/6)*canvasHeight;
const yLineMargin = (3/2)*rectSize;
const xPlayer = 800;
const nameY = 750;
const xOther = 200;
const largeTextSize = 50;
const smallTextSize = 30;

function createLabel(x, y, text, color, size){   
    labels.push({'x': x, 'y': y, 'text': text, 'color': color, 'size': size});
}

function createRect(x, y, width, height, color, id, onClick, border=false){
    rects.push({'xMin': x, 'xMax': x+width, 'yMin': y, 'yMax': y+height, 'color': color, 'id': id, 'onClick': onClick,
                'border': border});
}

function removeRect(ind){
    if(ind>=rects.length){throw "Exceeds array";}
    rects[ind] = null;
}

function removeLabel(ind){
    if(ind>=labels.length){throw "Exceeds array";}
    labels[ind] = null;
}

function createSelectionLine(lineInd, x, y, enabled=true){
    let initX = x;
    for(let i=0;i<codeLength;++i){
        function getSelectFunction(codeInd, rectInd, enabled) {
            return function(){
                if(!enabled){return;}
                if(selectedColor==-1){
                    return;
                }
                let color = colors[selectedColor]['hexCode'];
                lines[lineInd]['code'][codeInd] = selectedColor;
                rects[rectInd]['color'] = color;
                socket.emit('mousePress', {'line': lineInd, 'rect': codeInd, 'color': color});
            }
        }
        lines[lineInd]['rectInds'].push(rects.length);
        createRect(initX+i*(rectMargin+rectSize), y, rectSize, rectSize, emptyColor, 'line' + lineInd + i,
                   getSelectFunction(i, rects.length, enabled));
    }
}

function createInputLine(x, y){
    lines['input'] = {code: [-1, -1, -1, -1], rectInds:[], flagInds: []};
    createSelectionLine('input', x, y);
}

function createLine(lineInd, x, y, enabled=true){
    lines[lineInd] = {code: [-1, -1, -1, -1], rectInds:[], flagInds: []};
    let initX = x+codeLength*(rectSize+rectMargin);
    createSelectionLine(lineInd, x, y, enabled);
    for(let i=0;i<codeLength;++i){
        lines[lineInd]['flagInds'].push(rects.length);
        createRect(initX+(Math.floor(i/2))*(rectSize/3), y+(i%2)*(rectSize/3), rectSize/4, rectSize/4, bgColor, 'flags' + lineInd + i,
                   function(){}, true);
    }
    if(enabled){
        sendButton.onclick = function(){
            sendGuess(lineInd);
        };
    }
}

function initColorPallette(){
    for(let index = 0;index<colors.length;++index){

        function getSelectFunction(val) {
            return function(){
                rects[selectionRectInd]['color'] = colors[val]['hexCode'];
                selectedColor = val;
            }
        }

        createRect(rectMargin, rectMargin+(rectSize+rectMargin)*index, rectSize, rectSize,
                   colors[index]['hexCode'], colors[index]['name'], getSelectFunction(index));        
    }
}

function initSelectionBox(){
    selectionRectInd = rects.length;
    createRect(selectionX, selectionY, selectionRect, selectionRect, emptyColor, 'selection', function(){});
}

function refresh(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for(let ind=0;ind<rects.length;++ind){
        if(!rects[ind]){continue;}
        let x=rects[ind]['xMin']; let y=rects[ind]['yMin'];
        let width=rects[ind]['xMax']-x; let height=rects[ind]['yMax']-y;
        if(rects[ind]['color'] == null){
            throw "Color is undefined";
        }
        ctx.fillStyle = rects[ind]['color'];
        ctx.fillRect(x, y, width, height);
        if(rects[ind]['border']){
            ctx.strokeStyle="rgba(0,0,0,1)";
            ctx.strokeRect(x,y,width,height);
        }
    }
    for(let ind=0;ind<labels.length;++ind){
        if(!labels[ind]){continue;}
        let x=labels[ind]['x']; let y=labels[ind]['y']; 
        let text=labels[ind]['text']; let color=labels[ind]['color'];
        let size = labels[ind]['size'];
        ctx.font = size + "px Arial";
        ctx.fillStyle = color;
        ctx.fillText(text, x, y); 
    }
}

function compare(code1, code2){
    ordered = 0; unordered = 0; correctIndices1 = []; correctIndices2 = [];
    for(let i=0;i<codeLength;++i){
        if(code1[i] == code2[i]){
            correctIndices1.push(i);
            correctIndices2.push(i);
            ordered++;
        }
    }
    for(let i=0;i<codeLength;++i){
        if(correctIndices1.includes(i)){continue;}
        for(let j=0;j<codeLength;++j){
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

function flagLine(lineInd, ordered, unordered){
    let flagIndsArr = lines[lineInd]['flagInds'];
    if(ordered+unordered>codeLength){
        throw "Flags exceed code length";
    }
    for(let i=0;i<codeLength;++i){
        if(ordered>0){
            ordered--;
            rects[flagIndsArr[i]]['color'] = orderedColor;
            continue;
        }
        if(unordered>0){
            unordered--;
            rects[flagIndsArr[i]]['color'] = unorderedColor;
            continue;
        }
        rects[flagIndsArr[i]]['color'] = bgColor;
    }
    refresh();
}

function newGame(){
    socket.emit("newGameYes");
    for(let line in lines){
        removeLine(line);
        delete lines[line];
    }
    lines = {};
    labels = [];
    rects = [];
    socket.removeAllListeners('mousePress');
    socket.removeAllListeners('otherResult');
    socket.removeAllListeners('otherVictory');
    socket.removeAllListeners('result');
    socket.removeAllListeners('victory');
    socket.removeAllListeners('noMoreTurns');
    socket.removeAllListeners('serverFull');
    socket.removeAllListeners('startGame');
    gameStarted = false;
    initColorPallette();
    initCanvasMastermind();
    enterCodeScreen();
    refresh();
}

function showNewGameAlert(){
    let newGameModal = document.getElementById("newGameModal");
    newGameModal.style.display = "block";
    let yesButton = document.getElementById("playAgainYes");
    let noButton = document.getElementById("playAgainNo");
    yesButton.addEventListener("click", function(){
        newGame();
        newGameModal.style.display = "none";
    });
    noButton.addEventListener("click", function(){
        newGameModal.style.display = "none";
    });
}

function code(){
    inputCode = lines['input']['code'];
    hiddenCode = lines[0]['code'];
    comparision = compare(inputCode, hiddenCode);
    flagLine(0, comparision['ordered'], comparision['unordered']);
    socket.emit('code', hiddenCode);
}

function checkCode(code){
    return !code.includes(-1);
}

function disableLine(ind){
    for(let i=0;i<lines[ind]['rectInds'].length;++i){
        let rectInd = lines[ind]['rectInds'][i];
        rects[rectInd]['onClick'] = function(){};
    }
}

function finishIteration(ind){
    return (ordered, unordered)=>{
        console.log('lambda ' + ind + 'ordered ', ordered);
        flagLine(ind, ordered, unordered);
        if(ordered<codeLength){
            createLine(ind+1, xPlayer, yLineInit-(ind+2)*yLineMargin);
        }else{
            sendButton.onClick = ()=>{};
        }
    };
}


function sendGuess(ind){
    code = lines[ind]['code'];
    if(code.includes(-1)){
        alert(WRONG_CODE_TXT);
        return;
    }
    socket.emit('guess', code);
    disableLine(ind);
    let finishIterationLambda = finishIteration(ind);
    socket.on('result', function(res){
        let ordered = res['ordered']; let unordered = res['unordered'];
        finishIterationLambda(ordered, unordered);
        refresh();
        socket.off('result');
    });
    socket.on('victory', function(){
        showPopup(VICTORY_TXT);
        socket.off('victory');
    });
    socket.on('noMoreTurns', function(){
        showPopup(NO_MORE_TURNS_TXT);
        socket.off('noMoreTurns');
    });
    socket.on('gameFinished', function(){
        showNewGameAlert();
    });
}

function removeLine(lineid){
    let rects = lines[lineid]['rectInds'];
    for(let i=0;i<rects.length;++i){
        removeRect(rects[i]);
    }
    rects = lines[lineid]['flagInds'];
    for(let i=0;i<rects.length;++i){
        removeRect(rects[i]);
    }
}

function enterCodeScreen(){
    enterCodeLabelInd = labels.length;
    createLabel(xPlayer, 550, CHOOSE_CODE_TXT, 'black',largeTextSize);
    createInputLine(xPlayer, yLineInit);
    sendButton.onclick = function(){
        sendCode();
    };
}

function createOtherLine(lineInd){
    function getOtherResult(lineInd){
        return function(result){
            socket.off('otherResult');
            let ordered = result['ordered']; let unordered = result['unordered'];
            console.log('otherResult ' + ordered + ',' + unordered);
            flagLine('other' + lineInd, ordered, unordered);
            if(ordered<codeLength){
                createOtherLine(lineInd+1);
            }
            refresh();
        }
    }
    createLine('other' + lineInd, xOther, yLineInit-(lineInd+1)*yLineMargin, false);
    socket.on('otherResult', getOtherResult(lineInd));
}

function createCodeLine(){
    lines['code'] = {code: lines['input']['code'], rectInds:[], flagInds: []};
    createSelectionLine('code', xOther, yLineInit, false);
    console.log(lines['code']);
    for(let i=0;i<codeLength;++i){
        rects[lines['code']['rectInds'][i]]['color'] = colors[lines['input']['code'][i]]['hexCode'];
    }
    refresh();
}

function startGame(otherPlayer){
    if(gameStarted){
        throw "Game already started!";
    }
    gameStarted = true;
    removeLabel(enterCodeLabelInd);
    createCodeLine();
    createLine(0, xPlayer, yLineInit-yLineMargin);
    otherPlayerLabelInd = labels.length;
    createLabel(xOther+(codeLength/2)*(rectSize+rectMargin), nameY, otherPlayer, 'black', smallTextSize);
    createOtherLine(0);
    socket.on('mousePress', (params)=>{
        let color = params['color']; let lineInd = 'other' + params['line'];
        let rectInd = lines[lineInd]['rectInds'][params['rect']];
        rects[rectInd]['color'] = color;
        refresh();
    });
    socket.on('otherVictory', function(name){
        showPopup(name + ' ' + WON_TXT);
        socket.off('otherVictory');
    });
    refresh();
}

function initCanvasMastermind(){
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');    
    canvas.height = canvasHeight; canvas.width = canvasWidth;
    initColorPallette();
    initSelectionBox();
}

function sendCode(){
    if(!checkCode(lines['input']['code'])){
        alert(WRONG_CODE_TXT);
        return;                
    }
    sendButton.onClick = ()=>{};
    socket.emit('code', {'code': lines['input']['code']});
    removeLine('input');
    labels[enterCodeLabelInd]['text'] = WAITING_FOR_PLAYER_TXT;
    refresh();
    socket.on('serverFull', function(name){
        labels[enterCodeLabelInd]['text'] = SERVER_FULL_TXT;
        refresh();
    });
    socket.on('startGame', function(name){
        startGame(name);
        socket.off('startGame');
    });
}


export function initMastermind(sock){
    socket = sock;
    socket.emit('gameType', 'mastermind');  
    initCanvasMastermind();
    sendButton = document.getElementById('sendButton')
    enterCodeScreen();
    document.addEventListener('mousedown', mouseDown);
    refresh();
}


function getCursorPosition(event) {
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    if(x<0 || x>canvasWidth || y<0 || y>canvasHeight){
        return null;
    }
    return {x: x, y: y}
}

function checkClick(x, y){
    for(let ind=0;ind<rects.length;++ind){
        if(!rects[ind]){continue;}
        let xMin = rects[ind]['xMin'];
        let xMax = rects[ind]['xMax'];
        let yMin = rects[ind]['yMin'];
        let yMax = rects[ind]['yMax'];
        if(xMin<=x && x<=xMax && yMin<=y && y<=yMax){
            rects[ind]['onClick']();
        }
    }
}

function mouseDown(e){
    let coords = getCursorPosition(e);
    if(coords!=null){
        let x = coords['x'];
        let y = coords['y'];
        checkClick(x, y);
    }
    refresh();
}