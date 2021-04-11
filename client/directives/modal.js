var jsGames = angular.module("jsGames");

jsGames.directive("focus", ['modalsService', function(modals) {
    return {
        scope:{
            focus: "=",
        },

        link: function(scope, element, attr){
            if(scope.focus){
                scope.$watchCollection(()=>{
                    return modals.getCustomModal(scope.focus).isVisible();
                }, function(){
                    element[0].focus();
                });
            }
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

jsGames.controller("modalsController", function($scope, modalsService){
    $scope.modalsList = [];
    $scope.$watchCollection(function(){return modalsService.getModalsList();},
    function(){
        $scope.modalsList = modalsService.getModalsList();
    });
});


  jsGames.directive("customModal", ['modalsService', function(modals) {
    return {
        controller: function($scope){
            $scope.title = "";
            $scope.element = null;
            $scope.inputs= {};
            $scope.buttons = [];
            $scope.defaultButton = 0;
            $scope.hideModal = function(){
                $scope.element.style.display = "none";
            };
            $scope.resetModal = function(){
                $scope.title = "";
                $scope.inputs= {};
                $scope.buttons = [];
            };
            $scope.addInput = function(key, desc, value){
                $scope.inputs[key] = {'desc': desc, 'value': value, 'focus': false};
            };
            $scope.setFocus = function(key){
                for(let currKey in $scope.inputs){
                    $scope.inputs[currKey].focus = false;
                }
                $scope.inputs[key].focus = $scope.name;
            };
            $scope.showModal = function(){
                $scope.element.style.display = "block";
            };
            $scope.isVisible = function(){
                return $scope.element.style.display == "block";
            };
            $scope.setDefaultButton = function(ind){
                if(ind<0 || ind>=$scope.buttons.length){
                    throw "Invalid index for default button";
                }
                $scope.defaultButton = ind;
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
                return $scope.buttons.length-1;
            };
            $scope.setTitle = function(newTitle){
                $scope.title = newTitle;
            };
            $scope.updateScope = function(){
                $scope.$apply();
            };
        },
        scope:{
            name: "=",
            visible: "=",
            title: "=",
            inputs: "=",
            buttons: "=",
        },
        templateUrl: "./client/directives/modal.html",
        link: function(scope, element, attr){
            let modal = element[0].children[0];
            scope.element = modal;
            modals.registerCustomModal(scope.name, scope);
            if(attr.visible && attr.visible!="false"){
                scope.showModal();
            }        
            element.bind("keyup", function (event) {
                if(event.which === 13) {
                    if(scope.defaultButton!=-1){
                        scope.onClick(scope.defaultButton);
                    }
                }
            });
        }
    };
  }]);
  
  