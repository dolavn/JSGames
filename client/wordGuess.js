let jsGames = angular.module("jsGames");

const BREAK_ROW = 15;
const MUST_BREAK = 25;
const WON_TXT = "ניצח";
const LOST_TXT = "הפסיד";
const YOU_WON_TXT = "כל הכבוד ניצחת!";
const YOU_LOST_TXT = "לצערנו הפסדת";
const LINE_DELIMETER = '-';
const BREAK_TYPE = {
	NONE: 0,
	SPACE: 1,
	DELIMETER: 2,
    MUST_BREAK: 3,
}

function splitToRows(input, delimeters){
    function shouldBreak(currRow, currChar){
        if(delimeters==null){
            return currRow.length>BREAK_ROW?BREAK_TYPE.DELIMETER:BREAK_TYPE.NONE;
        }
        if(currRow.length>MUST_BREAK){return BREAK_TYPE.MUST_BREAK;}
        if(currRow.length>BREAK_ROW && delimeters.includes(currChar)){
            return currChar==' '?BREAK_TYPE.SPACE:BREAK_TYPE.DELIMETER;
        }
        return BREAK_TYPE.NONE;
    }
    
    let output = [];
    output.push([]);
    let curr_ind = 0;
    for(let i=0;i<input.length;++i){
        let breakType = shouldBreak(output[curr_ind], input[i]);
        if(breakType){ //break type isn't none  
            if(breakType==BREAK_TYPE.MUST_BREAK){
                output[curr_ind].push(input[i]);
                output[curr_ind].push(LINE_DELIMETER);
            }
            if(breakType==BREAK_TYPE.DELIMETER){
                output[curr_ind].push(input[i]);
            }
            output.push([]);
            curr_ind++;     
            continue;
        }
        output[curr_ind].push(input[i]);
    }
    return output;
}

const ALPHABET = 'אבגדהוזחטיכלמנסעפצקרשת';

jsGames.controller("wordGuessController", function($scope, socketService,
                                                   userData, modalsService){
    $scope.gameState = {started: false, waiting: false};
    $scope.gameAreas = [{hiddenWord: [], rowArray: [], playerName: '', turnsLeft: 0},
                        {hiddenWord: [], rowArray: [], playerName: '', turnsLeft: 0}];
    $scope.pressed = [];
    $scope.alphabet = ALPHABET;
    $scope.hiddenChar = null;
    $scope.delimeters = '';
    $scope.alphabetRows = [];
    $scope.turnsLeft = 0;
    $scope.$on('wordGuessStarted',
               function(e, args){
                   $scope.initGame(args);
                });
    $scope.resetScope = function(){
        $scope.gameState.started=false; $scope.gameState.waiting=true;
        $scope.gameAreas[0] = {hiddenWord: [], rowArray: [], playerName: '', turnsLeft: 0};
        $scope.gameAreas[1] = {hiddenWord: [], rowArray: [], playerName: '', turnsLeft: 0};
        $scope.pressed = [];
    };
    $scope.showPopup = function(text){
        let modal = modalsService.getCustomModal('wordGuessModal2');
        modal.resetModal();
        modal.setTitle(text);
        modal.addButton('אישור', ()=>{
            modal.hideModal();
        }, 'modalButtonClose');
        modal.showModal();
    };
    $scope.getImage = function(turnsLeft){
        return './client/images/hangedMan' + (6-turnsLeft).toString() + '.png';
    };
    $scope.splitToRows = function (input){
        return splitToRows(input, $scope.delimeters);
    };
    $scope.setParams = function(params){
        $scope.alphabet = params.alphabet;
        $scope.hiddenChar = params.hiddenChar;
        $scope.delimeters = params.delimeters;
        $scope.turnsLeft = params.maxTurns;
        $scope.gameState.waiting = true;
    };

    $scope.getNewGameModal = function(){
        let socket = socketService.getSocket();
        let modal = modalsService.getCustomModal('wordGuessModal1');
        modal.resetModal();
        modal.setTitle("רוצה לשחק שוב?");
        modal.addButton('כן', ()=>{
            socket.emit('newGameYes');
            modal.hideModal();
        }, 'modalButtonAccept');
        modal.addButton('לא', ()=>{
            modal.hideModal();
        }, 'modalButtonClose');
        return modal;
    };

    $scope.setupHandlers = function(){
        let socket = socketService.getSocket();
        socket.on('queryAnswer', (answer)=>{
            $scope.handleQuery(answer, 0);
            $scope.$apply();
        });
        socket.on('otherQueryAnswer', (answer)=>{
            $scope.handleQuery(answer, 1);
            $scope.$apply();
        }); 
        socket.on('wrong', ()=>{
            $scope.handleWrong(0);
            $scope.$apply();
        });
        socket.on('otherWrong', ()=>{
            $scope.handleWrong(1);
            $scope.$apply();
        });
        socket.on('victory', ()=>{
            $scope.showPopup(YOU_WON_TXT);
            $scope.$apply();
        });
        socket.on('defeat', ()=>{
            $scope.showPopup(YOU_LOST_TXT);
            $scope.$apply();
        });
        socket.on('otherVictory', (name)=>{
            $scope.showPopup(name + ' ' + WON_TXT);
            $scope.$apply();
        });
        socket.on('otherDefeat', (name)=>{
            $scope.showPopup(name + ' ' + LOST_TXT);
            $scope.$apply();
        });
        socket.on('newGame', ()=>{
            let modal = $scope.getNewGameModal();
            modal.showModal();
            $scope.$apply();
        });
        socket.on('resetGame', ()=>{
            $scope.resetScope();
            $scope.$apply();
        });
    }

    $scope.initGameArea = function(ind, hiddenWord, playerName, turnsLeft){
        $scope.gameAreas[ind].hiddenWord = hiddenWord;
        $scope.gameAreas[ind].rowArray = splitToRows(hiddenWord);
        $scope.gameAreas[ind].playerName = playerName;
        $scope.gameAreas[ind].turnsLeft = turnsLeft;
    };

    $scope.startGame = function(gameData){
        $scope.initGameArea(0, gameData.otherHiddenWord, userData.getUname(),
                            $scope.turnsLeft);
        $scope.initGameArea(1, gameData.yourHiddenWord, gameData.otherName,
                            $scope.turnsLeft);
        $scope.alphabetRows = splitToRows($scope.alphabet);
        $scope.gameState.waiting = false;
        $scope.gameState.started = true;
        $scope.setupHandlers();
    };

    $scope.createWordChooseModal = function(){
        let socket = socketService.getSocket();
        let modal = modalsService.getCustomModal('wordGuessModal1');
        modal.resetModal();
        modal.setTitle("בחר את המילה");
        modal.addInput('word', 'מילה', '');
        modal.addButton('שלח', ()=>{
            socket.emit('word', modal.getInput('word'));
        }, 'modalButtonAccept');
        return modal;
    };

    $scope.checkEnabled = function(letter){
        return $scope.pressed.includes(letter);
    };

    $scope.handleWrong = function(gameAreaInd){
        $scope.gameAreas[gameAreaInd].turnsLeft--;
    };

    $scope.handleQuery = function(queryResult, gameAreaInd){
        let letter = queryResult.letter;
        let indices = queryResult.occurrences;
        for(let i=0;i<indices.length;++i){
            $scope.gameAreas[gameAreaInd].hiddenWord[indices[i]] = letter;
        }
        $scope.gameAreas[gameAreaInd].rowArray = $scope.splitToRows($scope.gameAreas[gameAreaInd].hiddenWord);
    };

    $scope.buttonPress = function(letter){
        let socket = socketService.getSocket();
        socket.emit('letterChoice', letter);
        $scope.pressed.push(letter);
    };
    
    $scope.initGame = function(args){
        args.gameScreen.setWidth(0);
        args.gameScreen.setHeight(0);
        let socket = socketService.getSocket();
        socket.emit('gameType', 'wordGuess');
        socket.on('gameParams', (params)=>{
            $scope.setParams(params);
            let modal = $scope.createWordChooseModal();
            socket.on('error', (word)=>{$scope.showPopup(word);$scope.$apply();});
            socket.on('accept', ()=>{modal.hideModal();$scope.$apply();});
            socket.on('startGame', (gameData)=>{
                 $scope.startGame(gameData);
                 $scope.$apply();
            });
            modal.showModal();
            $scope.$apply();
        });
    };
});
