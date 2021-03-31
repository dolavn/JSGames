let jsGames = angular.module("jsGames");

const LETTERS_IN_ROW = 15;

function splitToRows(input){
    let output = [];
    output.push([]);
    let curr_ind = 0;
    for(let i=0;i<input.length;++i){
        if(output[curr_ind].length>=LETTERS_IN_ROW){
            output.push([]);
            curr_ind++;
        }
        output[curr_ind].push(input[i]);
    }
    return output;
}

const ALPHABET = 'אבגדהוזחטיכלמנסעפצקרשת';

jsGames.controller("wordGuessController", function($scope, socketService,
                                                   userData, modalsService){
    $scope.started = false;
    $scope.word = '';
    $scope.rowArray = [];
    $scope.alphabet = '';
    $scope.hiddenChar = null;
    $scope.alphabetRows = [];
    $scope.$on('wordGuessStarted',
               function(e, args){
                   $scope.initGame(args);
                });
    
    $scope.showPopup = function(text){
        let modal = modalsService.getCustomModal('wordGuessModal2');
        modal.resetModal();
        modal.setTitle(text);
        modal.addButton('אישור', ()=>{
            modal.hideModal();
        }, 'modalButtonClose');
        modal.showModal();
    };

    $scope.setParams = function(params){
        $scope.alphabet = params.alphabet;
        $scope.hiddenChar = params.hiddenChar;
        $scope.started = true;
    };

    $scope.startGame = function(otherWord){
        $scope.rowArray = splitToRows(otherWord);
        $scope.alphabetRows = splitToRows($scope.alphabet);
        console.log('starting', $scope.rowArray);
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
            socket.on('startGame', (otherData)=>{
                 $scope.startGame(otherData.hiddenWord);
                 $scope.$apply();
            });
            modal.showModal();
            $scope.$apply();
        });
    };
});
