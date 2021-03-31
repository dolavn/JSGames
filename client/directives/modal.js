var jsGames = angular.module("jsGames");

jsGames.directive("focus", ['modalsService', function(modals) {
    return {
        scope:{
            focus: "=",
        },

        link: function(scope, element, attr){
            scope.$watchCollection(()=>{
                return modals.isVisible(attr.focus);
            }, function(){
                element[0].focus();
            });
        }
    };
  }]);
  
jsGames.directive("modal", ['modalsService', function(modals) {
    return {
        controller: function($scope, modalsService){
            $scope.title = "baba";
            $scope.hideModal = function(name){
                modalsService.hideModal(name);
            }
        },
        scope:{
            modal: "=",
            visible: "=",
            title: "=",
        },
        link: function(scope, element, attr){
            modals.addModal(attr.modal, element[0]);
            if(attr.visible && attr.visible!="false"){
                modals.showModal(attr.modal);
            }
        }
    };
  }]);


  jsGames.directive("customModal", ['modalsService', function(modals) {
    return {
        controller: function($scope){
            $scope.title = "";
            $scope.element = null;
            $scope.inputs= {};
            $scope.buttons = [];
            
            $scope.hideModal = function(){
                $scope.element.style.display = "none";
            };
            $scope.resetModal = function(){
                $scope.title = "";
                $scope.inputs= {};
                $scope.buttons = [];
            };
            $scope.addInput = function(key, desc, value){
                $scope.inputs[key] = {'desc': desc, 'value': value};
            };
            $scope.showModal = function(){
                $scope.element.style.display = "block";
            };
            $scope.onClick = function(ind){
                $scope.buttons[ind].action();
            };
            $scope.getInput = function(key){
                return $scope.inputs[key].value;
            };
            $scope.addButton = function(text, action, buttonClass){
                $scope.buttons.push({text: text, action: action,
                                     class: buttonClass});
            };
            $scope.setTitle = function(newTitle){
                $scope.title = newTitle;
            };
        },
        scope:{
            name: "=",
            visible: "=",
            title: "=",
        },
        templateUrl: "./client/directives/modal.html",
        link: function(scope, element, attr){
            let modal = element[0].children[0];
            scope.element = modal;
            modals.addCustomModal(attr.name, scope);
            if(attr.visible && attr.visible!="false"){
                scope.showModal();
            }
        }
    };
  }]);
  
  