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
    $scope.runGame = function(id){
        let socket = socketService.getSocket();
        modalsService.hideModal('game');
        $scope.games[id].func(socket, gameScreenService, modalsService);
    };
});
