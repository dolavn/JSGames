let jsGames = angular.module("jsGames");
const MAX_UNAME = 12;

function truncateName(uname){
    if(uname.length<MAX_UNAME){return uname;}
    return uname.slice(0, MAX_UNAME) + "...";
}

jsGames.controller("chatAreaController", function($scope, socketService,
                                                  userData){
    let socket = socketService.getSocket();
    $scope.messages = [];
    $scope.users = [];
    $scope.username = '';
    $scope.$watch(function(){return userData.getUname();},
                  function(){$scope.username = userData.getUname();});
    socket.off('chatMessage');
    socket.on('logged_in_users', (users)=>{$scope.users = users; $scope.$apply();});
    socket.on('chatMessage', (msgTuple)=>{
        let uname = truncateName(msgTuple[0]); let message = msgTuple[1];
        $scope.messages.push({'uname': uname, 'message': message});
        $scope.$apply();
    });

    $scope.sendMessage = function(message){
        $scope.chatInput = "";
        socket.emit('chatMessage', message);
    }
});
