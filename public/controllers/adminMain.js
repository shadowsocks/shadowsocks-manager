app.controller('AdminMainController', function($scope, $http, $state, $mdSidenav, $window, $mdDialog, $q, $interval) {
        

        $scope.menuButton = function() {
            if(!$scope.publicInfo.menuButtonState) {
                $mdSidenav('left').toggle();
            } else {
                $state.go($scope.publicInfo.menuButtonState, $scope.publicInfo.menuButtonStateParams);
            }
        };
        $scope.menus = [
            {name: '首页', icon: 'home', click: 'admin.index'},
            {name: '服务器管理', icon: 'cloud', click: 'admin.server'},
            {name: '用户管理', icon: 'face', click: 'admin.user'},
            {name: '续费码', icon: 'shop', click: 'admin.unfinish'},
            {name: '流量统计', icon: 'timeline', click: 'admin.flow'},
            {name: '历史记录', icon: 'watch_later', click: 'admin.unfinish'}
        ];

        $scope.publicInfo = {
            title: '',                 //标题
            menuButtonIcon: 'menu',    //菜单或返回按钮
            menuButtonState: '',       //返回按钮跳转页面，非空时为返回按钮
            menuButtonStateParams: {},
            fabButtonIcon: '',
            fabButtonClick: '',
            isLoading: false,
            loadingText: '正在加载',
            loadingError: '',
            loadingErrorFn: function() {}
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
            $scope.publicInfo.loadingError = '';
            $scope.publicInfo.loadingErrorFn = function() {};

            $mdDialog.cancel();
        });
        
        var dialog = $mdDialog.prompt({
            templateUrl: '/public/views/admin/loading.html',
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
                        $mdDialog.cancel();
                        waitToCancel();
                        $scope.publicInfo.isLoading = false;
                        $scope.publicInfo.loadingText = '正在加载';
                        $scope.publicInfo.loadingError = '';
                        $scope.publicInfo.loadingErrorFn = function() {};
                    }
                });
            }
        };

        /*
        options: {
            error
            fn
        }
        */
        $scope.loadingError = function(options) {
            $scope.publicInfo.loadingError = options.error;
            $scope.publicInfo.loadingErrorFn = options.fn;
        };

        /*
        options: {
            type   : ['server','user','flow']
            loading: true/false
        }
        */
        $scope.initPublicInfo = function(options) {
            if($scope.publicInfo.loadingError) {return;}
            if(!options) {options = {
                type: ['server','user', 'flow'],
                loading: true
            };}
            if(!options.type) {options.type = ['server','user'];}

            if(!options.loading && $scope.publicInfo.lastUpdate) {
                var time = +new Date() - $scope.publicInfo.lastUpdate;
                if(time < 30 * 1000) {return;}
            }
            $scope.loading(options.loading);
            var promises = [];
            if(options.type.indexOf('server') >= 0) {
                promises[0] = $http.get('/admin/server');
            } else {
                promises[0] = undefined;
            }
            if(options.type.indexOf('user') >= 0) {
                promises[1] = $http.get('/admin/user');
            } else {
                promises[1] = undefined;
            }
            if(options.type.indexOf('flow') >= 0) {
                promises[2] = $http.get('/admin/flow');
            } else {
                promises[2] = undefined;
            }
            $q.all(promises).then(function(success) {
                $scope.loading(false);
                $scope.publicInfo.lastUpdate = new Date();
                if(success[0]) {
                    $scope.publicInfo.servers = success[0].data;
                }
                if(success[1]) {
                    $scope.publicInfo.users = success[1].data;
                }
                if(success[2]) {
                    $scope.publicInfo.servers.map(function(server) {
                        return server.account.map(function(account) {
                            var flow = success[2].data.filter(function(f) {
                                return (
                                    f.name === server.name &&
                                    f.port === account.port
                                    );
                            })[0];
                            if(flow) {
                                account.today = flow.today;
                                account.week = flow.week;
                                account.month = flow.month;
                            }
                            return account;
                        });
                    });
                }
            }, function(err) {
                if(!options.loading) {return;}
                $scope.loadingError({
                    error: '数据加载错误(' + err.status + ')',
                    fn: function() {
                        $window.location.reload();
                    }
                });
            });
        };
        $scope.initPublicInfo({type: ['server','user','flow'], loading: true});
        $interval(function() {
            $scope.initPublicInfo({type: ['server','user','flow'],loading: false});
        }, 10 * 1000);
        document.addEventListener('visibilitychange', function(){
            if(document.visibilityState === 'visible') {
                $scope.initPublicInfo({type: ['server','user','flow'],loading: false});
            }
        });
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

        

    });