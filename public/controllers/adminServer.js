app.controller('AdminServerController', function($scope, $http, $state, $mdDialog) {
        $scope.setTitle('服务器管理');
        $scope.setFabButtonClick(function(){
            $state.go('admin.addServer');
        });

        $scope.init = function() {
            if(!$scope.publicInfo.servers) {return;}
            $scope.serverList = $scope.publicInfo.servers;
        };
        $scope.init();
        $scope.$watch('publicInfo.servers', function() {
            $scope.init();
        }, false);
        $scope.serverPage = function(serverName) {
            $state.go('admin.serverPage', {serverName: serverName});
        };
    })
    .controller('AdminAddServerController', function($scope, $interval, $http, $state) {
        $scope.setTitle('添加服务器');
        $scope.setMenuButton('admin.server');
        $scope.server = {};
        $scope.addServer = function() {
            $scope.loading(true);
            $http.post('/api/admin/server', {
                name: $scope.server.name,
                ip: $scope.server.ip,
                port: $scope.server.port,
                method: $scope.server.method
            }).then(function(success) {
                $scope.loading(false);
                $scope.publicInfo.servers.push(success.data);
                $state.go('admin.server');
            }, function(error) {
                $scope.loadingMessage({
                    message: '添加服务器失败',
                    right: function() {
                        $scope.loading(false);
                    }
                });
            });
        };
        $scope.cancel = function() {$state.go('admin.server');};
    })
    .controller('AdminEditServerController', function($scope, $interval, $http, $state, $stateParams) {
        $scope.setTitle('编辑服务器');
        $scope.setMenuButton('admin.server');

        $scope.init = function() {
            if(!$scope.publicInfo.servers) {return;}
            $scope.server = $scope.publicInfo.servers.filter(function(f) {
                return f.name === $stateParams.serverName;
            })[0];
            if(!$scope.server) {return $state.go('admin.server');}
        };
        $scope.init();
        $scope.$watch('publicInfo.servers', function() {
            $scope.init();
        }, false);

        $scope.addServer = function() {
            $scope.loading(true);
            $http.put('/api/admin/server', {
                name: $scope.server.name,
                ip: $scope.server.ip,
                port: $scope.server.port,
                method: $scope.server.method
            }).then(function(success) {
                $scope.loading(false);
                $state.go('admin.serverPage', {serverName: $stateParams.serverName});
            }, function(error) {
                $scope.loadingMessage({message: '编辑服务器失败', right: function() {
                    $scope.initPublicInfo({loading: false});
                    $state.go('admin.serverPage', {serverName: $stateParams.serverName});
                }});
            });
        };
        $scope.cancel = function() {$state.go('admin.serverPage', {serverName: $stateParams.serverName});};
    })
    .controller('AdminServerPageController', function($scope, $interval, $http, $state, $stateParams, $mdDialog) {
        $scope.setTitle('服务器设置');
        $scope.setMenuButton('admin.server');
        $scope.setFabButtonClick(function(){
            $state.go('admin.addAccount', {serverName: $stateParams.serverName});
        });
        $scope.init = function() {
            if(!$scope.publicInfo.servers) {return;}
            $scope.server = $scope.publicInfo.servers.filter(function(f) {
                return f.name === $stateParams.serverName;
            })[0];
            if(!$scope.server) {return $state.go('admin.server');}
        };
        $scope.init();
        $scope.$watch('publicInfo', function() {
            $scope.init();
        }, true);
        
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
                $scope.loading(true);
                return $http.delete('/api/admin/server', {params: {
                    name: serverName
                }});
            }).then(function() {
                $scope.publicInfo.servers = $scope.publicInfo.servers.filter(function(f) {
                    return f.name !== $stateParams.serverName;
                });
                $state.go('admin.server');
            }).catch(function(error) {
                $mdDialog.cancel(confirm);
                $state.go('admin.server');
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
                $mdDialog.cancel(confirm);
                $scope.loading(true);
                $http.delete('/api/admin/account', {params: {
                    name: $stateParams.serverName,
                    port: port
                }}).then(function(success) {
                    $scope.server.account = success.data.account;
                    $scope.loading(false);
                }, function(error) {
                    $scope.loadingMessage({message: '删除账号失败', right: function() {
                        $scope.loading(false);
                    }});
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
        $scope.setMenuButton('admin.serverPage', {serverName: $stateParams.serverName});
        $scope.account = {};
        $scope.addAccount = function() {
            $scope.loading(true);
            $http.post('/api/admin/account', {
                name: $stateParams.serverName,
                port: $scope.account.port,
                password: $scope.account.password,
                userName: $scope.account.userName
            }).then(function(success) {
                var server = $scope.publicInfo.servers.filter(function(f) {
                    return f.name === $stateParams.serverName;
                })[0];
                server.account.push(success.data);
                $state.go('admin.serverPage', {serverName: $stateParams.serverName});
            }, function(error) {
                $scope.loadingMessage({message: '添加账号失败', right: function() {
                    $state.go('admin.serverPage', {serverName: $stateParams.serverName});
                }});
            });
        };
        $scope.cancel = function() {$state.go('admin.serverPage', {serverName: $stateParams.serverName,});};
    })
;