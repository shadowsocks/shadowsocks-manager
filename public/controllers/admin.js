app.controller('AdminMainController', function($scope, $http, $state, $mdSidenav, $window) {
        $scope.showMenu = function() {
            $mdSidenav('left').toggle();
        };
        $scope.menus = [
            {name: '服务器管理', icon: 'cloud', click: function() {
                $state.go('admin.server');
                $mdSidenav('left').close();
            }},
            {name: '用户管理', icon: 'face'},
            {name: '续费码', icon: 'shop'},
            {name: '流量统计', icon: 'timeline'},
            {name: '历史记录', icon: 'watch_later'}
        ];
        $scope.bottomMenus = [
            {name: '退出登录', icon: 'exit_to_app', click: function() {
                $http.post('/user/logout').success(function(data) {
                    $window.location.reload();
                });
            }}
        ];
    })
    .controller('AdminIndexController', function($scope, $http, $state) {

    })
    .controller('AdminServerController', function($scope, $http, $state) {

    })
;