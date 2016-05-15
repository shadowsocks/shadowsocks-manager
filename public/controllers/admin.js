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
                $state.go($scope.publicInfo.menuButtonState);
            }
        };
        $scope.menus = [
            {name: '首页', icon: 'home', click: 'admin.index'},
            {name: '服务器管理', icon: 'cloud', click: 'admin.server'},
            {name: '用户管理', icon: 'face'},
            {name: '续费码', icon: 'shop'},
            {name: '流量统计', icon: 'timeline', click: 'admin.flow'},
            {name: '历史记录', icon: 'watch_later'}
        ];
        $scope.publicInfo = {
            title: '',              //标题
            menuButtonIcon: 'menu', //菜单或返回按钮
            menuButtonState: '',    //返回按钮跳转页面，非空时为返回按钮
            fabButtonIcon: '',
            fabButtonClick: ''
        };
        $scope.setTitle = function(str) {
            $scope.publicInfo.title = str;
        };
        $scope.setMenuButton = function(str) {
            if(str === 'default') {
                $scope.publicInfo.menuButtonIcon = 'menu';
                $scope.publicInfo.menuButtonState = '';
            } else {
                $scope.publicInfo.menuButtonIcon = 'arrow_back';
                $scope.publicInfo.menuButtonState = str;
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
        // $scope.server = {};
        // $scope.serverPort = {};
        // $scope.addServerDialog = function() {
        //     $scope.dialog = $mdDialog.show({
        //         controller: AddServerDialogController,
        //         templateUrl: '/public/views/admin/addServer.html',
        //         locals : {
        //             addServer : $scope.addServer,
        //             server : $scope.server
        //         }
        //     });
        // };
        // $scope.addServerPortDialog = function(serverName) {
        //     $scope.dialog = $mdDialog.show({
        //         controller: AddServerPortDialogController,
        //         templateUrl: '/public/views/admin/addServerPort.html',
        //         locals : {
        //             serverName: serverName,
        //             serverPort : $scope.serverPort,
        //             addServerPort : $scope.addServerPort
        //         }
        //     });
        // };
        // $scope.addServer = function() {
        //     $http.post('/admin/server', {
        //         name: $scope.server.name,
        //         ip: $scope.server.ip,
        //         port: $scope.server.port
        //     }).success(function(data) {
        //         $scope.init();
        //         $mdDialog.cancel();
        //     }).error(function(err) {
        //         console.log(err);
        //     });
        // };
        // $scope.addServerPort = function() {
        //     // console.log($scope.serverPort);
        //     $http.post('/admin/serverPort', {
        //         name: $scope.serverPort.name,
        //         port: $scope.serverPort.port,
        //         password: $scope.serverPort.password
        //     }).success(function(data) {
        //         $scope.init();
        //         $mdDialog.cancel();
        //     }).error(function(err) {
        //         console.log(err);
        //     });
        // };
        // $scope.deleteServerPort = function(name, port) {
        //     $http.delete('/admin/serverPort', {
        //         params: {
        //             name: name,
        //             port: port
        //         }
        //     }).success(function(data) {
        //         $scope.init();
        //         console.log(data);
        //     }).error(function(err) {
        //         console.log(err);
        //     });
        // };
        // var AddServerDialogController = function($scope, $mdDialog, addServer, server) {
        //     $scope.server = server;
        //     $scope.cancel = function(){$mdDialog.cancel();};
        //     $scope.addServer = addServer;
        // };
        // var AddServerPortDialogController = function($scope, $mdDialog, serverPort, addServerPort, serverName) {
        //     $scope.serverPort = serverPort;
        //     $scope.serverPort.name = serverName;
        //     $scope.cancel = function(){$mdDialog.cancel();};
        //     $scope.addServerPort = addServerPort;
        // };
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
    .controller('AdminServerAccountController', function($scope, $interval, $http) {
        $scope.setTitle('帐号设置');
        $scope.setMenuButton('admin.server');
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
;