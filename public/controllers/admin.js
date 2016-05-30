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
app.controller('AdminIndexController', function($scope, $http, $state) {
        $scope.setTitle('首页');
        $scope.setMenuButton('default');
    })
    .controller('AdminEditAccountController', function($scope, $http, $state, $stateParams, $mdBottomSheet, $mdToast) {
        $scope.setTitle('编辑帐号');
        $scope.setMenuButton('admin.serverPage', {serverName: $stateParams.serverName});

        $scope.qrCode = '';
        var b64EncodeUnicode = function(str) {
            return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
                return String.fromCharCode('0x' + p1);
            }));
        };

        $scope.init = function() {
            if(!$scope.publicInfo.servers) {return;}
            $scope.server = $scope.publicInfo.servers.filter(function(f) {
                return f.name === $stateParams.serverName;
            })[0];
            if(!$scope.server) {$state.go('admin.serverPage', {serverName: $stateParams.serverName});}
            $scope.account = $scope.server.account.filter(function(f) {
                return f.port === +$stateParams.accountPort;
            })[0];
            if(!$scope.account) {$state.go('admin.serverPage', {serverName: $stateParams.serverName});}
            $scope.qrCode = 'ss://' + b64EncodeUnicode($scope.server.method + ':' + $scope.account.password + '@' + $scope.server.ip + ':' + $scope.account.port);
        };
        $scope.init();
        $scope.$watch('publicInfo', function() {
            $scope.init();
        }, true);

        $scope.setFlow = function(type, flow) {
            $scope.loading(true);
            $http.put('/api/admin/account', {
                type: type,
                name: $stateParams.serverName,
                port: $stateParams.accountPort,
                flow: flow
            }).then(function(success) {
                $scope.loading(false);
                $scope.account.flow = +success.data.flow;
            }, function(error) {
                $scope.loadingError({
                    error: '设置流量出错',
                    fn: function() {
                        $scope.loading(false);
                    }
                });
            });
        };
        $scope.setTime = function(type, time) {
            $scope.loading(true);
            $http.put('/api/admin/account', {
                type: type,
                name: $stateParams.serverName,
                port: $stateParams.accountPort,
                time: time
            }).then(function(success) {
                $scope.loading(false);
                $scope.account.expireTime = success.data.expireTime;
            }, function(error) {
                $scope.loadingError({
                    error: '设置有效期出错',
                    fn: function() {
                        $scope.loading(false);
                    }
                });
            });
        };

        $scope.flowBottomSheet = function() {
            $mdBottomSheet.show({
                templateUrl: '/public/views/admin/editAccountFlow.html',
                preserveScope: true,
                scope: $scope,
                controller: function($scope) {}
            });
        };
        $scope.timeBottomSheet = function() {
            $mdBottomSheet.show({
                templateUrl: '/public/views/admin/editAccountTime.html',
                preserveScope: true,
                scope: $scope,
                controller: function($scope) {}
            });
        };

    })
    .controller('AdminFlowController', function($scope, $interval, $http, $state) {
        $scope.setTitle('流量统计');

        $scope.tabs = [];
        $scope.init = function() {
            if(!$scope.publicInfo.servers) {return;}
            if($scope.tabs.length === 0) {
                $scope.tabs = $scope.publicInfo.servers;
            } else {
                $scope.tabs.forEach(function(tab, index) {
                    var server = $scope.publicInfo.servers.filter(function(f) {
                        return f.name === tab.name;
                    })[0];
                    $scope.tabs[index].account = server.account;
                });
            }
            $scope.tabs.forEach(function(tab) {
                tab.sum = {};
                tab.sum.today = tab.account.reduce(function(r, e) {
                    if(e.today) {return r + e.today;}
                    return r;
                }, 0);
                tab.sum.week = tab.account.reduce(function(r, e) {
                    if(e.week) {return r + e.week;}
                    return r;
                }, 0);
                tab.sum.month = tab.account.reduce(function(r, e) {
                    if(e.month) {return r + e.month;}
                    return r;
                }, 0);
            });
            
        };
        $scope.init();
        $scope.$watch('publicInfo', function() {
            $scope.init();
        }, true);

        $scope.accountPage = function(serverName, accountPort) {
            $scope.setMenuButtonHistoryBack();
            $state.go('admin.editAccount', {
                serverName: serverName,
                accountPort: accountPort
            });
        };
    })

    .controller('AdminUserController', function($scope, $state, $http) {
        $scope.setTitle('用户管理');

        $scope.init = function() {
            if(!$scope.publicInfo.users) {return;}
            $scope.users = $scope.publicInfo.users;
        };
        $scope.init();
        $scope.$watch('publicInfo', function() {
            $scope.init();
        }, true);

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
            if(!$scope.publicInfo.users) {return;}
            $scope.user = $scope.publicInfo.users.filter(function(f) {
                return f.email === $stateParams.userName;
            })[0];
            if(!$scope.user) {
                return $state.go('admin.user');
            }
        };
        $scope.init();
        $scope.$watch('publicInfo', function() {
            $scope.init();
        }, true);

        $scope.delete = function(account) {
            var confirm = $mdDialog.confirm()
                .title('')
                .textContent('真的要删除帐号[' + account.port + ']吗？')
                .ariaLabel('delete')
                .ok('确定')
                .cancel('取消');
            $mdDialog.show(confirm).then(function() {
                $http.delete('/api/admin/userAccount', {params: {
                    name: $stateParams.userName,
                    server: account.server,
                    port: account.port
                }}).success(function(data) {
                    $scope.initPublicInfo();
                });
            }, function() {
                $mdDialog.cancel(confirm);
            });
        };

        $scope.edit = function(account) {
            $scope.setMenuButtonHistoryBack();
            $state.go('admin.editAccount', {
                serverName: account.server,
                accountPort: account.port
            });
        };
    })
    .controller('AdminUserAddAccountController', function($scope, $http, $state, $stateParams) {
        $scope.setTitle('添加帐号');
        $scope.setMenuButton('admin.userPage', {userName: $stateParams.userName});

        $scope.init = function() {
            if(!$scope.publicInfo.servers) {return;}
            $scope.servers = $scope.publicInfo.servers;
        };
        $scope.init();
        $scope.$watch('publicInfo', function() {
            $scope.init();
        }, true);

        $scope.$watch('server', function() {
            if($scope.server) {
                $scope.serverObj = JSON.parse($scope.server);
                $scope.accounts = $scope.serverObj.account;
            }
        });

        $scope.addAccount = function() {
            if(!$scope.account) {return;}
            $scope.accountObj = JSON.parse($scope.account);
            $http.post('/api/admin/userAccount', {
                name: $stateParams.userName,
                serverName: $scope.serverObj.name,
                port: $scope.accountObj.port
            }).success(function(data) {
                $scope.initPublicInfo();
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