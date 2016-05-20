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
app.controller('AdminIndexController', function($scope, $http, $state) {
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
            if(!$scope.publicInfo.servers) {return;}
            $scope.serverList = $scope.publicInfo.servers;
        };
        $scope.init();
        $scope.$watch('publicInfo', function() {
            $scope.init();
        }, true);
        $scope.serverPage = function(serverName) {
            $state.go('admin.serverPage', {serverName: serverName});
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
    .controller('AdminServerPageController', function($scope, $interval, $http, $state, $stateParams, $mdDialog) {
        $scope.setTitle('服务器设置');
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
        $scope.editServer = function(serverName) {
            $state.go('admin.editServer', {serverName: serverName});
        };
        $scope.deleteServer = function(serverName) {
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
                    $state.go('admin.server');
                });
            }, function() {
                $mdDialog.cancel(confirm);
            });
        };
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
                $mdDialog.cancel(confirm);
            });
        };
        $scope.editAccount = function(account) {
            $state.go('admin.editAccount', {
                serverName: $stateParams.serverName,
                accountPort: account.port
            });
        };
    })
    .controller('AdminAddAccountController', function($scope, $interval, $http, $state, $stateParams) {
        $scope.setTitle('添加帐号');
        $scope.setMenuButton('admin.serverPage');
        $scope.account = {};
        $scope.addAccount = function() {
            $http.post('/admin/account', {
                name: $stateParams.serverName,
                port: $scope.account.port,
                password: $scope.account.password,
            }).success(function(data) {
                $state.go('admin.serverPage', {serverName: $stateParams.serverName});
            }).error(function(err) {
                console.log(err);
            });
        };
        $scope.cancel = function() {$state.go('admin.serverPage', {serverName: $stateParams.serverName,});};
    })
    .controller('AdminEditAccountController', function($scope, $http, $state, $stateParams) {
        $scope.setTitle('编辑帐号');
        $scope.setMenuButton('admin.serverPage', {serverName: $stateParams.serverName});
        $scope.init = function() {
            $http.get('/admin/server', {params: {
                serverName: $stateParams.serverName
            }}).success(function(data) {
                if(data[0]) {
                    $scope.server = data[0];
                    $scope.account = $scope.server.account.filter(function(f) {
                        return f.port === +$stateParams.accountPort;
                    })[0];
                } else {
                    $state.go('admin.serverPage', {serverName: $stateParams.serverName});
                }
            }).error(function(err) {
                $state.go('admin.serverPage', {serverName: $stateParams.serverName});
            });
        };
        $scope.init();
        $scope.addFlow = function(flow) {
            $http.put('/admin/account', {
                name: $stateParams.serverName,
                port: $stateParams.accountPort,
                flow: flow
            }).success(function(data) {
                $scope.init();
            });
        };
        $scope.addTime = function(time) {
            $http.put('/admin/account', {
                name: $stateParams.serverName,
                port: $stateParams.accountPort,
                time: time
            }).success(function(data) {
                $scope.init();
            });
        };
    })
    .controller('AdminFlowController', function($scope, $interval, $http) {
        $scope.setTitle('流量统计');
        // $scope.setMenuButton('default');
        $scope.getFlow = function() {
            $http.get('/admin/flow').success(function(data) {
                $scope.flow = data;
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
    .controller('AdminUserPageController', function($scope, $http, $state, $stateParams, $mdDialog) {
        $scope.setTitle('用户管理');
        $scope.setMenuButton('admin.user');
        $scope.setFabButtonClick(function(){
            $state.go('admin.userAddAccount', {userName: $stateParams.userName});
        });
        $scope.init = function() {
            $http.get('/admin/user', {params: {
                userName: $stateParams.userName
            }}).success(function(data) {
                $scope.user = data[0];
            });
        };
        $scope.init();

        $scope.delete = function(account) {
            var confirm = $mdDialog.confirm()
                .title('')
                .textContent('真的要删除帐号[' + account.port + ']吗？')
                .ariaLabel('delete')
                .ok('确定')
                .cancel('取消');
            $mdDialog.show(confirm).then(function() {
                $http.delete('/admin/userAccount', {params: {
                    name: $stateParams.userName,
                    server: account.server,
                    port: account.port
                }}).success(function(data) {
                    $scope.init();
                });
            }, function() {
                $mdDialog.cancel(confirm);
            });
        };
    })
    .controller('AdminUserAddAccountController', function($scope, $http, $state, $stateParams) {
        $scope.setTitle('添加帐号');
        $scope.setMenuButton('admin.userPage', {userName: $stateParams.userName});

        $http.get('/admin/server').success(function(data) {
            $scope.servers = data;
        });
        $scope.$watch('server', function() {
            if($scope.server) {
                $scope.serverObj = JSON.parse($scope.server);
                $scope.accounts = $scope.serverObj.account;
            }
        });

        $scope.addAccount = function() {
            if(!$scope.account) {return;}
            $scope.accountObj = JSON.parse($scope.account);
            $http.post('/admin/userAccount', {
                name: $stateParams.userName,
                serverName: $scope.serverObj.name,
                port: $scope.accountObj.port
            }).success(function(data) {
                $state.go('admin.userPage', {userName: $stateParams.userName});
            });
        };

        $scope.cancel = function() {
            $state.go('admin.userPage', {userName: $stateParams.userName});
        };
    })
    .controller('AdminUnfinishController', function($scope) {
        $scope.setTitle('404 Not Found');
    })
;