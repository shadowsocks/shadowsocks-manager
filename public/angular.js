var app = angular.module('StarterApp', ['ngMaterial']);

app.controller('AppCtrl', ['$scope', '$mdSidenav', '$http', '$interval',
    function($scope, $mdSidenav, $http, $interval){
        $scope.toggleSidenav = function(menuId) {
            $mdSidenav(menuId).toggle();
        };
        $scope.rate = {};
        $scope.getRate = [];
        $scope.allRate = 0;
        $scope.rateType = 'all';

        // $scope.$watch('rateType', function() {
        //     $scope.rate = $scope.getRate.map(function(f) {
        //         return {port: f.userId, rate: f[$scope.rateType]};
        //     });
        //     $scope.allRate = 0;
        //     $scope.rate.forEach(function(f) {
        //         $scope.allRate += f.rate;
        //     });
        // });
        $scope.setType = function(type) {
            $scope.rateType = type;
            $scope.allRate = 0;
            $scope.rate = {};
            $scope.getRate.forEach(function(f) {
                $scope.rate[f.userId] = f[$scope.rateType];
                $scope.allRate += f[$scope.rateType];
            });
        };
        
        var getRate = function() {
            $http.get('./rate').success(function(data) {
                $scope.getRate = data;
                $scope.allRate = 0;
                $scope.rate = {};
                data.forEach(function(f) {
                    $scope.rate[f.userId] = f[$scope.rateType];
                    $scope.allRate += f[$scope.rateType];
                });
                
            });
        };
        getRate();
        $interval(function() {
            getRate();
        }, 10000);

    }
]).filter('rate1024', function() {
    return function(input) {
        if (input < 1000) {
            return input +' B';
        } else if (input < 1000000) {
            return (input/1000).toFixed(2) +' KB';
        } else if (input < 1000000000) {
            return (input/1000000).toFixed(2) +' MB';
        } else if (input < 1000000000000) {
            return (input/1000000000).toFixed(2) +' GB';
        } else {
            return input;
        }
    };
});