app.controller('AdminMainController', function($scope, $http, $state, $mdSidenav, $window, $mdDialog, $q, $interval, $stateParams, $mdMedia) {
        $scope.innerSideNav = true;
        $scope.menuButton = function() {
            if(!$scope.publicInfo.menuButtonState) {
                if($mdMedia('gt-sm')) {
                    $scope.innerSideNav = !$scope.innerSideNav;
                } else {
                    $mdSidenav('left').toggle();
                }

            } else if(!$scope.publicInfo.menuButtonHistoryBackState) {
                $state.go($scope.publicInfo.menuButtonState, $scope.publicInfo.menuButtonStateParams);
            } else {
                $state.go($scope.publicInfo.menuButtonHistoryBackState, $scope.publicInfo.menuButtonHistoryBackStateParams);
            }
        };
        $scope.menus = [
            {name: '首页', icon: 'home', click: 'admin.index'},
            {name: '服务器管理', icon: 'cloud', click: 'admin.server'},
            {name: '用户管理', icon: 'face', click: 'admin.user'},
            {name: '续费码', icon: 'shop', click: 'admin.renew'},
            {name: '流量统计', icon: 'timeline', click: 'admin.flow.server'},
            {name: '历史记录', icon: 'watch_later', click: 'admin.unfinish'},
            {name: '系统设置', icon: 'settings', click: 'admin.options'}
        ];

        $scope.publicInfo = {
            title: '',                 //标题
            menuButtonIcon: 'menu',    //菜单或返回按钮
            menuButtonState: '',       //返回按钮跳转页面，非空时为返回按钮
            menuButtonStateParams: {},
            menuButtonHistoryBackState: '',
            menuButtonHistoryBackStateParams: {},
            menuButtonHistoryBackMark: false,
            fabButtonIcon: '',
            fabButtonClick: '',
            isLoading: false,
            loadingText: '正在加载',
            messageTitle: '',
            messageData: '',
            buttonLeftFn: '',
            buttonRightFn: '',
            methods: ['aes-256-cfb', 'aes-192-cfb','aes-128-cfb', 'table', 'rc4', 'rc4-md5', 'chacha20', 'chacha20-ietf'],
            colors: ['BDBDBD', 'FFCDD2', 'F8BBD0', 'E1BEE7', 'BBDEFB', 'B2DFDB', 'F0F4C3'],
            searchBar: false,
            searchText: '',
            search: false
        };
        $scope.flowChart = {};

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
            $scope.publicInfo.searchBar = false;
            $scope.publicInfo.searchText = '';
            $scope.publicInfo.search = false;

            $mdDialog.cancel();

            if(!$scope.publicInfo.menuButtonHistoryBackMark && $scope.publicInfo.menuButtonHistoryBackState) {
                $scope.publicInfo.menuButtonHistoryBackMark = true;
            } else if($scope.publicInfo.menuButtonHistoryBackMark) {
                $scope.publicInfo.menuButtonHistoryBackState = '';
                $scope.publicInfo.menuButtonHistoryBackStateParams = {};
                $scope.publicInfo.menuButtonHistoryBackMark = false;
            }
        });
        $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
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

        /*
        options: {
            type   : ['server','user','flow']
            loading: true/false
        }
        */
        $scope.initPublicInfo = function(options) {
            if($scope.publicInfo.messageData) {return;}
            if(!options) {options = {
                type: ['server','user', 'flow', 'code'],
                loading: true
            };}
            if(!options.type) {options.type = ['server','user', 'flow', 'code'];}

            if(!options.loading && $scope.publicInfo.lastUpdate) {
                var time = +new Date() - $scope.publicInfo.lastUpdate;
                if(time < 30 * 1000) {return;}
            }
            $scope.loading(options.loading);
            var promises = [];
            if(options.type.indexOf('server') >= 0) {
                promises[0] = $http.get('/api/admin/server');
            } else {
                promises[0] = undefined;
            }
            if(options.type.indexOf('user') >= 0) {
                promises[1] = $http.get('/api/admin/user');
            } else {
                promises[1] = undefined;
            }
            if(options.type.indexOf('flow') >= 0) {
                promises[2] = $http.get('/api/admin/flow');
            } else {
                promises[2] = undefined;
            }
            if(options.type.indexOf('code') >= 0) {
                promises[3] = $http.get('/api/admin/code');
            } else {
                promises[3] = undefined;
            }
            $q.all(promises).then(function(success) {
                $scope.loading(false);
                $scope.publicInfo.lastUpdate = new Date();
                if(success[0]) {
                    $scope.publicInfo.servers = success[0].data;
                    $scope.$broadcast('initPublicInfo', 'server');
                }
                if(success[1]) {
                    $scope.publicInfo.users = success[1].data;
                    $scope.$broadcast('initPublicInfo', 'user');
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
                    $scope.$broadcast('initPublicInfo', 'flow');
                }
                if(success[3]) {
                    $scope.publicInfo.codes = success[3].data;
                }
            }, function(error) {
                if(error.status === 401) {
                    $window.location.href = '/';
                }
                if(!options.loading) {return;}
                $scope.loadingMessage({
                    message: '数据加载错误(' + error.status + ')',
                    right: function() {
                        $window.location.reload();
                    }
                });
            });
        };
        $scope.initPublicInfo({loading: true});
        $interval(function() {
            if(document.visibilityState === 'visible') {
                if($scope.publicInfo.lastUpdate && (+new Date() - $scope.publicInfo.lastUpdate) > 5 * 30 * 1000) {
                    $scope.initPublicInfo({loading: true});
                } else {
                    $scope.initPublicInfo({loading: false});
                }
            }
        }, 10 * 1000);
        document.addEventListener('visibilitychange', function(){
            if(document.visibilityState === 'visible') {
                $scope.initPublicInfo({loading: false});
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
        $scope.setMenuButtonHistoryBack = function() {
            var str = $state.current.name;
            var obj = $state.params;
            $scope.publicInfo.menuButtonHistoryBackState = str;
            $scope.publicInfo.menuButtonHistoryBackStateParams = obj;
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
                    $window.location.href = '/';
                });
            }}
        ];

        $scope.showSearchBar = function() {
            $scope.publicInfo.searchBar = true;
        };
        $scope.hideSearchBar = function() {
            $scope.publicInfo.searchBar = false;
        };

        

    });