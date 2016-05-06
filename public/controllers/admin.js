app.controller('AdminIndexController', function($scope, $http, $state) {
        $scope.logout = function() {
            $http.post('/user/logout');
        };
    })
    .controller('TestCtrl', function($scope, $http, $state, $mdSidenav) {
        $scope.showMenu = function() {
            $mdSidenav('left').toggle();
        };
        $scope.menus = [
            {name: '我的账户'},
            {name: '修改密码'},
            {name: '流量统计'},
            {name: '续费'}
        ];
    });