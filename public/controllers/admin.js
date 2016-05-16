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
app.controller('AdminMainController', function($scope, $http, $state, $mdSidenav, $window, $mdDialog) {
        $scope.loading = function(isLoading) {
            dialog = $mdDialog.prompt({
                templateUrl: '/public/views/admin/loading.html',
                escapeToClose : false
            });
            if(isLoading) {
                $mdDialog.show(dialog);
            } else {
                console.log($mdDialog);
                $mdDialog.cancel(dialog);
            }
        };
        // $scope.loading(true);
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
            {name: '续费码', icon: 'shop'},
            {name: '流量统计', icon: 'timeline', click: 'admin.flow'},
            {name: '历史记录', icon: 'watch_later'}
        ];
        $scope.publicInfo = {
            title: '',              //标题
            menuButtonIcon: 'menu', //菜单或返回按钮
            menuButtonState: '',    //返回按钮跳转页面，非空时为返回按钮
            menuButtonStateParams: {},
            fabButtonIcon: '',
            fabButtonClick: ''
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

        $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
            $scope.publicInfo.title = '';
            $scope.publicInfo.menuButtonIcon = 'menu';
            $scope.publicInfo.menuButtonState = '';
            $scope.publicInfo.menuButtonStateParams = {};
            $scope.publicInfo.fabButtonClick = '';

            // $scope.loading(false);
        });
    })
    .controller('AdminIndexController', function($scope, $http, $state) {
        $scope.setTitle('首页');
        $scope.setMenuButton('default');
    })
    .controller('AdminServerController', function($scope, $http, $state, $mdDialog) {
        $scope.setTitle('服务器管理');
        // $scope.setMenuButton('default');
        $scope.setFabButtonClick(function(){
            $state.go('admin.addServer');
        });
        $scope.init = function() {
            $http.get('/admin/server').success(function(data) {
                $scope.serverList = data;
            });
        };
        $scope.init();
        $scope.account = function(serverName) {
            $state.go('admin.serverAccount', {serverName: serverName});
        };
        $scope.edit = function(serverName) {
            $state.go('admin.editServer', {serverName: serverName});
        };
        $scope.delete = function(serverName) {
            var confirm = $mdDialog.confirm()
                .title('')
                .textContent('真的要删除服务器[' + serverName + ']吗？')
                .ariaLabel('delete')
                .ok('确定')
                .cancel('取消');
            $mdDialog.show(confirm).then(function() {
                $http.delete('/admin/server', {params: {
                    name: serverName
                }}).success(function(data) {
                    $scope.init();
                });
            }, function() {
                $mdDialog.close();
            });
        };
    })
    .controller('AdminAddServerController', function($scope, $interval, $http, $state) {
        $scope.setTitle('添加服务器');
        $scope.setMenuButton('admin.server');
        $scope.server = {};
        $scope.addServer = function() {
            $http.post('/admin/server', {
                name: $scope.server.name,
                ip: $scope.server.ip,
                port: $scope.server.port
            }).success(function(data) {
                $state.go('admin.server');
            }).error(function(err) {
                console.log(err);
            });
        };
        $scope.cancel = function() {$state.go('admin.server');};
    })
    .controller('AdminEditServerController', function($scope, $interval, $http, $state, $stateParams) {
        $scope.setTitle('编辑服务器');
        $scope.setMenuButton('admin.server');
        $http.get('/admin/server', {params: {
            serverName: $stateParams.serverName
        }}).success(function(data) {
            if(data[0]) {
                $scope.server = data[0];
            } else {
                $state.go('admin.server');
            }
        }).error(function(err) {
            $state.go('admin.server');
        });
        $scope.addServer = function() {
            $http.put('/admin/server', {
                name: $scope.server.name,
                ip: $scope.server.ip,
                port: $scope.server.port
            }).success(function(data) {
                $state.go('admin.server');
            }).error(function(err) {
                console.log(err);
            });
        };
        $scope.cancel = function() {$state.go('admin.server');};
    })
    .controller('AdminServerAccountController', function($scope, $interval, $http, $state, $stateParams, $mdDialog) {
        $scope.setTitle('帐号设置');
        $scope.setMenuButton('admin.server');
        $scope.setFabButtonClick(function(){
            $state.go('admin.addAccount', {serverName: $stateParams.serverName});
        });
        $scope.init = function() {
            $http.get('/admin/server', {params: {
                serverName: $stateParams.serverName
            }}).success(function(data) {
                if(data[0]) {
                    $scope.server = data[0];
                } else {
                    $state.go('admin.server');
                }
            }).error(function(err) {
                $state.go('admin.server');
            });
        };
        $scope.init();
        $scope.deleteAccount = function(port) {
            var confirm = $mdDialog.confirm()
                .title('')
                .textContent('真的要删除帐号[' + port + ']吗？')
                .ariaLabel('delete')
                .ok('确定')
                .cancel('取消');
            $mdDialog.show(confirm).then(function() {
                $http.delete('/admin/account', {params: {
                    name: $stateParams.serverName,
                    port: port
                }}).success(function(data) {
                    $scope.init();
                });
            }, function() {
                $mdDialog.close();
            });
        };
    })
    .controller('AdminAddAccountController', function($scope, $interval, $http, $state, $stateParams) {
        $scope.setTitle('添加帐号');
        $scope.setMenuButton('admin.serverAccount');
        $scope.account = {};
        $scope.addAccount = function() {
            $http.post('/admin/account', {
                name: $stateParams.serverName,
                port: $scope.account.port,
                password: $scope.account.password,
            }).success(function(data) {
                $state.go('admin.serverAccount', {serverName: $stateParams.serverName,});
            }).error(function(err) {
                console.log(err);
            });
        };
        $scope.cancel = function() {$state.go('admin.serverAccount', {serverName: $stateParams.serverName,});};
    })
    .controller('AdminFlowController', function($scope, $interval, $http) {
        $scope.setTitle('流量统计');
        // $scope.setMenuButton('default');
        $scope.getFlow = function() {
            $http.get('/admin/flow').success(function(data) {
                $scope.flow = data;
                console.log(data);
                $scope.flow.sort(function(a, b) {
                    return b.flow - a.flow;
                });
            });
        };
        $scope.getFlow();
        $interval(function() {
            $scope.getFlow();
        }, 10 * 1000);
        $scope.allFlow = 0;
        $scope.$watch('flow', function() {
            $scope.allFlow = 0;
            if(!$scope.flow) {return;}
            $scope.flow.forEach(function(f) {
                $scope.allFlow += f.flow;
            });
        });
    })

    .controller('AdminUserController', function($scope, $state, $http) {
        $scope.setTitle('用户管理');

        $http.get('/admin/user').success(function(data) {
            $scope.users = data;
        });
        $scope.userPage = function(userName) {
            $state.go('admin.userPage', {userName: userName});
        };
    })
    .controller('AdminUserPageController', function($scope, $http, $state, $stateParams) {
        $scope.setTitle('用户管理');
        $scope.setMenuButton('admin.user');
        $scope.setFabButtonClick(function(){
            $state.go('admin.userAddAccount', {userName: $stateParams.userName});
        });
        $http.get('/admin/user', {params: {
            userName: $stateParams.userName
        }}).success(function(data) {
            $scope.user = data[0];
        });
    })
    .controller('AdminUserAddAccountController', function($scope, $http, $state, $stateParams) {
        $scope.setTitle('添加帐号');
        $scope.setMenuButton('admin.userPage', {userName: $stateParams.userName});

        $http.get('/admin/server').success(function(data) {
            $scope.servers = data;
        });
        // setInterval(function() {
        //     console.log($scope.accounts);
        //     // console.log($scope.server);
        // }, 1000);

        $scope.$watch('server', function() {
            $scope.accounts = JSON.parse($scope.server).account;
        });
    })
;