var app = angular.module('StarterApp', ['ngMaterial']);

app.controller('AppCtrl', ['$scope', '$mdSidenav', '$http', '$interval',
    function($scope, $mdSidenav, $http, $interval){
        $scope.toggleSidenav = function(menuId) {
            $mdSidenav(menuId).toggle();
        };
        $scope.rate = {};
        
        var getRate = function() {
            $http.get('./rate').success(function(data) {
                $scope.allRate = 0;
                for(var d in data) {
                    $scope.allRate += data[d];
                    if(data[d] < 1000) {
                        data[d] += ' B';
                    } else if (data[d] < 1000000) {
                        data[d] = (data[d]/1000).toFixed(2) + ' KB';
                    } else if (data[d] < 1000000000) {
                        data[d] = (data[d]/1000000).toFixed(2) + ' MB';
                    } else if (data[d] < 1000000000000) {
                        data[d] = (data[d]/1000000000).toFixed(3) + ' GB';
                    }
                }
                $scope.rate = data;

                if($scope.allRate < 1000) {
                    $scope.allRate = ($scope.allRate + ' B');
                } else if ($scope.allRate < 1000000) {
                    $scope.allRate = ($scope.allRate/1000).toFixed(2) + ' KB';
                } else if ($scope.allRate < 1000000000) {
                    $scope.allRate = ($scope.allRate/1000000).toFixed(2) + ' MB';
                } else if ($scope.allRate < 1000000000000) {
                    $scope.allRate = ($scope.allRate/1000000000).toFixed(3) + ' GB';
                }
            });
        };
        getRate();
        $interval(function() {
            getRate();
        }, 10000);
    }
]);