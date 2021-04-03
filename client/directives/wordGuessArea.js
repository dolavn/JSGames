let jsGames = angular.module("jsGames");

jsGames.directive("wordGuessArea", [function() {
    return {
        scope:{
            user: "=",
            gameArea: "=",
        },
        templateUrl: "./client/directives/wordGuessArea.html",
        link: function(scope){
            scope.alphabetRows = scope.$parent.alphabetRows;
            scope.buttonPress = function(letter){
                return scope.$parent.buttonPress(letter);
            };
            scope.checkEnabled = function(letter){
                return scope.$parent.checkEnabled(letter);
            };
            scope.getImage = function(turnsLeft){
                return scope.$parent.getImage(turnsLeft);
            };
        },
    };
  }]);