
var jsGames = angular.module("jsGames");

jsGames.directive("scrollBottom", function() {
    return {
        scope:{
            scrollBottom: "="
        },
        link: function(scope, element){
            scope.$watchCollection('scrollBottom', function(newValue){
                if (newValue){
                    element[0].scrollTop = element[0].scrollHeight;
                    element[0].scrollLeft = element[0].scrollWidth;
                }
            });
        }
    };
  });
  