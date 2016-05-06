app.controller('UserIndexController', function($scope, $http, $state) {
    $scope.logout = function() {
        $http.post('/user/logout');
    };
})
.controller('TestCtrl', function($scope, $http, $state, $mdSidenav) {
    $scope.showMenu = function() {
        $mdSidenav('left').toggle();
    };
    $scope.settings = [
    { name: 'Wi-Fi', extraScreen: 'Wi-fi menu', icon: 'wifi', enabled: true },
    { name: 'Bluetooth', extraScreen: 'Bluetooth menu', icon: 'bluetooth', enabled: false },
  ];
})
;