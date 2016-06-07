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
app.filter('relativeTime', function() {
    return function(input) {
        
        var ret = '';
        var retTail = '';

        var time = (+new Date()) - (new Date(input));
        if(time < 0) {time = -time;}
        else retTail = '前';

        var day = Math.trunc(time/(24 * 3600 * 1000));
        var hour = Math.trunc(time%(24 * 3600 * 1000)/(3600* 1000));
        var minute = Math.trunc(time%(24 * 3600 * 1000)%(3600* 1000)/(60 * 1000));
        if(day) {ret += day + '天';}
        if(day || hour) {ret += hour + '小时';}
        if(!day && (hour || minute)) {ret += minute + '分钟';}
        if(time < (60 * 1000)) {ret = '几秒';}

        return ret + retTail;
    };
});
app.controller('UserMainController', function($scope, $http, $state, $mdSidenav, $window, $mdDialog, $interval, $timeout) {
        $scope.menus = [
            {name: '首页', icon: 'home', click: 'user.index'},
            {name: '我的帐户', icon: 'cloud', click: 'user.account'},
            {name: '修改密码', icon: 'lock_outline', click: 'user.changePassword'},
            {name: '流量统计', icon: 'timeline', click: 'user.flow'},
            {name: '续费', icon: 'vpn_key', click: 'user.renew'}
        ];
        $scope.publicInfo = {
            title: '',              //标题
            menuButtonIcon: 'menu', //菜单或返回按钮
            menuButtonState: '',    //返回按钮跳转页面，非空时为返回按钮
            menuButtonStateParams: {},
            fabButtonIcon: '',
            fabButtonClick: '',
            isLoading: false,
            loadingText: '正在加载',
            messageTitle: '',
            messageData: '',
            buttonLeftFn: '',
            buttonRightFn: '',
        };
        $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
            $scope.publicInfo.title = '';
            $scope.publicInfo.menuButtonIcon = 'menu';
            $scope.publicInfo.menuButtonState = '';
            $scope.publicInfo.menuButtonStateParams = {};
            $scope.publicInfo.fabButtonIcon = '';
            $scope.publicInfo.fabButtonClick = '';
            $scope.publicInfo.isLoading = false;
            $scope.publicInfo.loadingText = '正在加载';
            $scope.publicInfo.MessageTitle = '';
            $scope.publicInfo.MessageData = '';
            $scope.publicInfo.buttonLeftFn = '';
            $scope.publicInfo.buttonRightFn = '';

            $mdDialog.cancel();
        });
        $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
        });

        var dialog = $mdDialog.prompt({
            templateUrl: '/public/views/user/loading.html',
            escapeToClose : false,
            scope: $scope,
            preserveScope: true,
            controller: function($scope) {
                $scope.publicInfo.isLoading = true;
            }
        });

        $scope.loading = function(isLoading) {
            if(isLoading) {
                $mdDialog.show(dialog);
            } else {
                var waitToCancel = $scope.$watch('publicInfo.isLoading', function() {
                    if($scope.publicInfo.isLoading) {
                        $mdDialog.cancel().finally(function() {
                            $scope.publicInfo.isLoading = false;
                            $scope.publicInfo.loadingText = '正在加载';
                            $scope.publicInfo.messageTitle = '';
                            $scope.publicInfo.messageData = '';
                            $scope.publicInfo.buttonLeftFn = '';
                            $scope.publicInfo.buttonRightFn = '';
                        });
                        waitToCancel();
                    }
                });
            }
        };
        /*
        options: {
            title
            message
            left
            right
        }
        */
        $scope.loadingMessage = function(options) {
            if(!options) {options = {};}
            $scope.publicInfo.loadingText = '';
            $scope.publicInfo.messageTitle = options.title;
            $scope.publicInfo.messageData = options.message;
            $scope.publicInfo.buttonLeftFn = options.left;
            $scope.publicInfo.buttonRightFn = options.right;
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
                $http.post('/api/home/logout').success(function(data) {
                    $window.location.reload();
                });
            }}
        ];

        $scope.initPublicInfo = function(options) {
            if($scope.publicInfo.messageData) {return;}
            if(!options) {options = {
                loading: true
            };}
            if(!options.loading && $scope.publicInfo.lastUpdate) {
                var time = +new Date() - $scope.publicInfo.lastUpdate;
                if(time < 60 * 1000) {return;}
            }
            $scope.loading(options.loading);
            $http.get('/api/user/userInfo').then(function(success) {
                $scope.loading(false);
                $scope.publicInfo.lastUpdate = new Date();
                $scope.publicInfo.user = success.data;
                console.log(success.data);
            }, function(error) {
                if(!options.loading) {return;}
                $scope.loadingMessage({
                    message: '数据加载错误(' + error.status + ')',
                    right: function() {
                        $window.location.reload();
                    }
                });
            });
        };
        $scope.initPublicInfo();
        $interval(function() {
            if(document.visibilityState === 'visible') {
                $scope.initPublicInfo({loading: false});
            }
        }, 25 * 1000);
        document.addEventListener('visibilitychange', function(){
            if(document.visibilityState === 'visible') {
                $scope.initPublicInfo({loading: false});
            }
        });
    })
;