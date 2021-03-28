let jsGames = angular.module("jsGames");

jsGames.controller("loginController", function($scope, userData, socketService,
                                               modalsService){
    $scope.unameInput = "";
    $scope.setName = function(user){
        if(user==""){
            modalsService.showModal('alert');
        }else{
            let socket = socketService.getSocket();
            userData.setUname(user);
            socket.emit('uname', user);
            modalsService.hideModal('loginModal');
            modalsService.showModal('game');
        }
    }
    $scope.hideModal = function(name){
        modalsService.hideModal(name)
    }
});

