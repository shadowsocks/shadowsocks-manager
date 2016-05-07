app.controller('AdminMainController', function($scope, $http, $state, $mdSidenav, $window) {
        $scope.showMenu = function() {
            $mdSidenav('left').toggle();
        };
        $scope.menus = [
            {name: '首页', icon: 'home', click: 'admin.index'},
            {name: '服务器管理', icon: 'cloud', click: 'admin.server'},
            {name: '用户管理', icon: 'face'},
            {name: '续费码', icon: 'shop'},
            {name: '流量统计', icon: 'timeline'},
            {name: '历史记录', icon: 'watch_later'}
        ];
        $scope.publicInfo = {
            currentMenu: 0
        };
        $scope.menuClick = function(index) {
            $scope.publicInfo.currentMenu = index;
            $state.go($scope.menus[index].click);
            $mdSidenav('left').close();
        };
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