let jsGames = angular.module("jsGames");

jsGames.controller("loginController", function($rootScope, $scope, userData, 
                                               socketService,  modalsService){
    $scope.unameInput = "";
    $scope.createdModals = 0;
    $scope.setName = function(){
        let modal = modalsService.getCustomModal('login');
        let user = modal.getInput('name');
        if(user==""){
            modalsService.showModal('loginAlert');
        }else{
            let socket = socketService.getSocket();
            userData.setUname(user);
            socket.emit('uname', user);
            modal.hideModal();
            modalsService.destroyModal('login');
            $rootScope.$broadcast('chooseGame');
        }
    }

    $scope.hideModal = function(name){
        modalsService.hideModal(name)
    }

    $scope.showLoginModal = function(){
        let modal = modalsService.getCustomModal('login');
        modal.showModal();
    }

    $scope.registerLoginModal = function(){
        let modal = modalsService.getCustomModal('login');
        modal.setTitle("הזן את שמך");
        modal.addInput('name', 'שם משתמש', '');
        modal.setFocus('name');
        modal.addButton('שלח', $scope.setName, 'modalButtonAccept');
        $scope.createdModals++;
        if($scope.createdModals==2){$scope.showLoginModal();}
    };

    $scope.registerLoginAlertModal = function(){
        let modal = modalsService.getCustomModal('loginAlert');
        modal.setTitle("שם לא חוקי");
        modal.addButton('אישור', ()=>{
            modal.hideModal();
        }, 'modalButtonAccept');
        $scope.createdModals++;
        if($scope.createdModals==2){$scope.showLoginModal();}
    };

    let init = function(){
        modalsService.addCustomModal('login', $scope.registerLoginModal);
        modalsService.addCustomModal('loginAlert', $scope.registerLoginAlertModal);
    };
    init();
});

