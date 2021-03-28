import {initMastermind} from './mastermind.js';
import {initPong} from './pong.js';
import {initWordGuess} from './wordGuess.js';


let jsGames = angular.module("jsGames");

jsGames.controller("chooseGameController", function($scope, socketService, modalsService) { 
    $scope.title = "בחר משחק";
    $scope.games = [
        {desc:'בול פגיעה', id:0, func:initMastermind},
        {desc:'פונג', id:1, func:initPong},
        {desc:'איש תלוי', id:2, initWordGuess},
      ];
    $scope.runGame = function(id){
        let socket = socketService.getSocket();
        modalsService.hideModal('game');
        $scope.games[id].func(socket);
    };
});
