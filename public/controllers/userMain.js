app.controller('UserMainController', function($scope, $http, $state, $mdSidenav, $window, $mdDialog) {
        $scope.menus = [
            {name: '首页', icon: 'home', click: 'user.index'},
            {name: '我的帐户', icon: 'cloud', click: 'user.account'},
            {name: '修改密码', icon: 'lock_outline', click: 'admin.user'},
            {name: '流量统计', icon: 'timeline', click: 'admin.flow'},
            {name: '续费', icon: 'vpn_key', click: 'admin.unfinish'}
        ];
        $scope.publicInfo = {
            title: '',              //标题
            menuButtonIcon: 'menu', //菜单或返回按钮
            menuButtonState: '',    //返回按钮跳转页面，非空时为返回按钮
            menuButtonStateParams: {},
            fabButtonIcon: '',
            fabButtonClick: ''
        };
        $scope.menuButton = function() {
            if(!$scope.publicInfo.menuButtonState) {
                $mdSidenav('left').toggle();
            } else {
                $state.go($scope.publicInfo.menuButtonState, $scope.publicInfo.menuButtonStateParams);
            }
        };
        $scope.setTitle = function(str) {
            $scope.publicInfo.title = str;
        };
        $scope.setMenuButton = function(str, obj) {
            if(str === 'default') {
                $scope.publicInfo.menuButtonIcon = 'menu';
                $scope.publicInfo.menuButtonState = '';
                $scope.publicInfo.menuButtonStateParams = {};
            } else {
                $scope.publicInfo.menuButtonIcon = 'arrow_back';
                $scope.publicInfo.menuButtonState = str;
                if(obj) {
                    $scope.publicInfo.menuButtonStateParams = obj;
                }
            }
        };
        $scope.setFabButtonClick = function(fn) {
            $scope.publicInfo.fabButtonClick = fn;
        };
        $scope.menuClick = function(index) {
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
        $scope.init = function() {
            $http.get('/user/userInfo').success(function(data) {
                $scope.publicInfo.user = data;
            });
        };
        $scope.init();
    })
;