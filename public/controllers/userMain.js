app.filter('flow1024', function() {
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
app.controller('UserMainController', function($scope, $http, $state, $mdSidenav, $window, $mdDialog, $interval) {
        $scope.menus = [
            {name: '首页', icon: 'home', click: 'user.index'},
            {name: '我的帐户', icon: 'cloud', click: 'user.account'},
            {name: '修改密码', icon: 'lock_outline', click: 'user.changePassword'},
            {name: '流量统计', icon: 'timeline', click: 'admin.flow'},
            {name: '续费', icon: 'vpn_key', click: 'admin.unfinish'}
        ];
        $scope.publicInfo = {
            lastUpdate: '',
            title: '',              //标题
            menuButtonIcon: 'menu', //菜单或返回按钮
            menuButtonState: '',    //返回按钮跳转页面，非空时为返回按钮
            menuButtonStateParams: {},
            fabButtonIcon: '',
            fabButtonClick: '',
            isLoading: false
        };
        var dialog = $mdDialog.prompt({
            templateUrl: '/public/views/user/loading.html',
            escapeToClose : false,
            scope: $scope,
            preserveScope: true,
            controller: function($scope) {
                $scope.publicInfo.isLoading = true;
            }
        });

        $scope.loadingText = '正在加载';

        $scope.loading = function(isLoading) {
            if(isLoading) {
                $mdDialog.show(dialog);
            } else {
                var waitToCancel = $scope.$watch('publicInfo.isLoading', function() {
                    if($scope.publicInfo.isLoading) {
                        $mdDialog.cancel();
                        waitToCancel();
                        $scope.publicInfo.isLoading = false;
                    }
                });
            }
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
        // $scope.init = function() {
        //     $http.get('/user/userInfo').success(function(data) {
        //         $scope.publicInfo.user = data;
        //     });
        // };
        // $scope.init();

        $scope.initPublicInfo = function(options) {
            if(!options) {options = {
                loading: true
            };}
            if(!options.loading && $scope.publicInfo.lastUpdate) {
                var time = +new Date() - $scope.publicInfo.lastUpdate;
                if(time < 30 * 1000) {return;}
            }
            $scope.loading(options.loading);
            $http.get('/user/userInfo').success(function(data) {
                $scope.loading(false);
                $scope.publicInfo.lastUpdate = new Date();
                $scope.publicInfo.user = data;
            });
        };
        $scope.initPublicInfo();
        $interval(function() {
            $scope.initPublicInfo({loading: false});
        }, 10 * 1000);
    })
;