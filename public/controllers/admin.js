app.controller('AdminIndexController', function($scope, $http, $state) {
        $scope.logout = function() {
            $http.post('/user/logout');
        };
    })
    .controller('TestCtrl', function($scope, $http, $state, $mdSidenav, $window) {
        $scope.showMenu = function() {
            $mdSidenav('left').toggle();
        };
        $scope.menus = [
            {name: '服务器管理'},
            {name: '用户管理'},
            {name: '续费码'},
            {name: '流量统计'},
            {name: '历史记录'}
        ];
        $scope.bottomMenus = [
            {name: '退出登录', click: function() {
                console.log('GGGG');
                $http.post('/user/logout').success(function(data) {
                    $window.location.reload();
                });
            }}
        ];

    });