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
        scope:{
            modal: "=",
            visible: "=",
        },
        
        link: function(scope, element, attr){
            modals.addModal(attr.modal, element[0]);
            if(attr.visible && attr.visible!="false"){
                modals.showModal(attr.modal);
            }
        }
    };
  }]);
  