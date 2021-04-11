import {initMastermind} from './mastermind.js';
import {initPong} from './pong.js';


let jsGames = angular.module("jsGames");

jsGames.controller("chooseGameController", function($rootScope, $scope, socketService, modalsService,
                                                    gameScreenService) { 
    $scope.title = "בחר משחק";
    $scope.games = [
        {desc:'בול פגיעה', id:0, func:initMastermind},
        {desc:'פונג', id:1, func:initPong},
        {desc:'איש תלוי', id:2, func: function(socket, gameScreenService, modalsService){
            $rootScope.$broadcast('wordGuessStarted', {'socket': socket,
                                                       'gameScreen': gameScreenService,
                                                       'modals': modalsService});
        }},
      ];
    $scope.registerChooseGameModal = function(){
        let modal = modalsService.getCustomModal('chooseGame');
        modal.setTitle($scope.title);
        for(let i=0;i<$scope.games.length;++i){
            modal.addButton($scope.games[i].desc,
                            ()=>{$scope.runGame($scope.games[i].id)},
                            'gameButton');
        }
        modal.showModal();
    };
    $scope.createChooseGameModal = function(){
        modalsService.addCustomModal('chooseGame', $scope.registerChooseGameModal);
    };
    $scope.$on('chooseGame',
      function(e, args){
          $scope.createChooseGameModal();
    });
    $scope.runGame = function(id){
        let socket = socketService.getSocket();
        modalsService.hideModal('chooseGame');
        modalsService.destroyModal('chooseGame');
        $scope.games[id].func(socket, gameScreenService, modalsService);
    };
});
