app.filter('flow1024', function() {
    return function(input) {
        if (input < 1000) {
            return input +' B';
        } else if (input < 1000000) {
            return (input/1000).toFixed(1) +' KB';
        } else if (input < 1000000000) {
            return (input/1000000).toFixed(1) +' MB';
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
app.filter('renewTime', function() {
    return function(input) {

        var time = input;
        var ret = '';

        var day = Math.trunc(time/(24 * 3600 * 1000));
        var hour = Math.trunc(time%(24 * 3600 * 1000)/(3600* 1000));
        var minute = Math.trunc(time%(24 * 3600 * 1000)%(3600* 1000)/(60 * 1000));
        var secend = Math.trunc(time%(24 * 3600 * 1000)%(3600* 1000)%(60 * 1000)/1000);
        if(day) {ret += day + '天';}
        if(day || hour) {ret += hour + '小时';}
        if(!day && (hour || minute)) {ret += minute + '分钟';}
        if(time < (60 * 1000)) {ret += secend +'秒';}

        return ret;
    };
});
app.controller('AdminIndexController', function($scope, $http, $state) {
        $scope.setTitle('首页');
        $scope.setMenuButton('default');

        $scope.init = function() {
            if(!$scope.publicInfo.servers) {return;}
            $scope.users = angular.copy($scope.publicInfo.users);
            if(!$scope.users) {return;}
            $scope.userLastSign = $scope.users.sort(function(a, b) {
                if(a.createTime > b.createTime) {return -1;}
                if(a.createTime <= b.createTime) {return 1;}
                return 0;
            })[0];
            $scope.userLastLogin = $scope.users.filter(function(f) {
                return f.lastLogin;
            }).sort(function(a, b) {
                if(a.lastLogin > b.lastLogin) {return -1;}
                if(a.lastLogin <= b.lastLogin) {return 1;}
                return 0;
            })[0];
            $scope.serverSum = 0;
            $scope.publicInfo.servers.forEach(function(server) {
                server.account.forEach(function(a) {
                    if(a.month) {$scope.serverSum += a.month;}
                });
            });
        };
        $scope.init();
        $scope.$watch('publicInfo', function() {
            $scope.init();
        }, true);

    })
    .controller('AdminEditAccountController', function($scope, $http, $state, $stateParams, $mdBottomSheet, $mdToast, $filter, $interval) {
        $scope.setTitle('编辑帐号');
        $scope.serverName = $stateParams.serverName;
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
        $scope.toUserPage = function(userName) {
            $scope.setMenuButtonHistoryBack();
            $state.go('admin.userPage', {userName: userName});
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
                $scope.loadingMessage({
                    message: '设置流量出错',
                    right: function() {
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
                $scope.loadingMessage({
                    message: '设置有效期出错',
                    right: function() {
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

        var scaleLabel = function(chart) {
            var input = chart.value;
            if (input < 1000) {
                return input +' B';
            } else if (input < 1000000) {
                return (input/1000).toFixed(0) +' KB';
            } else if (input < 1000000000) {
                return (input/1000000).toFixed(0) +' MB';
            } else if (input < 1000000000000) {
                return (input/1000000000).toFixed(1) +' GB';
            } else {
                return input;
            }
        };
        $scope.chartType = 'hour';
        $scope.chartChange = function(type) {
            if(type === 'hour') {

                $scope.getChart($scope.flowChart[$stateParams.serverName].hour, 'hour');
            }
            if(type === 'day') {
                $scope.getChart($scope.flowChart[$stateParams.serverName].day, 'day');
            }
            if(type === 'week') {
                $scope.getChart($scope.flowChart[$stateParams.serverName].week, 'week');
            }
        };
        $scope.getChart = function(chart, type) {
            $http.post('/api/admin/flowChart', {
                server: $stateParams.serverName,
                port: $stateParams.accountPort,
                type: type,
                page: $scope.flowChart[$stateParams.serverName][type].page
            }).then(function(success) {
                chart.sum = 0;
                chart.startTime = success.data[0].time;
                chart.endTime = success.data[success.data.length - 1].time;
                chart.labels = [];
                chart.series = [];
                chart.data = [[]];
                success.data.forEach(function(f, i) {
                    if(type === 'week') {
                        chart.labels[i] = $filter('date')(f.time, 'EEE');
                    } else {
                        chart.labels[i] = (i%4===0)?$filter('date')(f.time, 'HH:mm'):'';
                    }
                    chart.data[0][i] = f.flow;
                    chart.sum += f.flow;
                });
                chart.options = {
                    pointHitDetectionRadius: 1,
                    scaleLabel: scaleLabel,
                    tooltipTemplate: scaleLabel
                };
            });
        };
        if(!$scope.flowChart[$stateParams.serverName]) {
            $scope.flowChart[$stateParams.serverName] = {
                hour: {page: 0},
                day: {page :0},
                week: {page: 0}
            };
        }

        $scope.prev = function() {
            $scope.flowChart[$stateParams.serverName][$scope.chartType].page += 1;
            $scope.getChart($scope.flowChart[$stateParams.serverName][$scope.chartType], $scope.chartType);
        };
        $scope.reset = function() {
            $scope.flowChart[$stateParams.serverName].hour.page = 0;
            $scope.flowChart[$stateParams.serverName].day.page = 0;
            $scope.flowChart[$stateParams.serverName].week.page = 0;
            $scope.getChart($scope.flowChart[$stateParams.serverName].hour, 'hour');
            $scope.getChart($scope.flowChart[$stateParams.serverName].day, 'day');
            $scope.getChart($scope.flowChart[$stateParams.serverName].week, 'week');
        };
        $scope.next = function() {
            if($scope.flowChart[$stateParams.serverName][$scope.chartType].page === 0) {
                return;
            }
            $scope.flowChart[$stateParams.serverName][$scope.chartType].page -= 1;
            $scope.getChart($scope.flowChart[$stateParams.serverName][$scope.chartType], $scope.chartType);
        };
        
        $scope.getChart($scope.flowChart[$stateParams.serverName].hour, 'hour');
        $scope.getChart($scope.flowChart[$stateParams.serverName].day, 'day');
        $scope.getChart($scope.flowChart[$stateParams.serverName].week, 'week');

        $scope.changeAutoRemove = function() {
            $scope.loading(true);
            $http.post('/api/admin/accountAutoRemove', {
                name: $stateParams.serverName,
                port: $stateParams.accountPort,
                value: $scope.account.autoRemove
            }).then(function(success) {
                $scope.loading(false);
            }, function(error) {
                $scope.loading(false);
                $scope.account.autoRemove = !$scope.account.autoRemove;
            });
        };
    })
    .controller('AdminFlowController', function($scope, $interval, $http, $state, $stateParams) {
        $scope.setTitle('流量统计');
        $scope.flowType = 0;
        $scope.deselectTab = false;
        $scope.tabs = [];
        $scope.tabIndex = {
            value: 0
        };
        $scope.init = function() {
            if(!$scope.publicInfo.servers) {return;}
            $scope.tabs = $scope.publicInfo.servers;
        };
        $scope.init();
        $scope.$watch('publicInfo.servers', function() {
            $scope.init();
        }, false);

        $scope.select = function(serverName, index) {
        };
        $scope.tabClick = function(serverName, index) {
            if($scope.deselectTab) {
                $scope.deselectTab = false;
                $state.go('admin.flow.server', {serverName: serverName});
            } else {
                $scope.flowType = 1 - $scope.flowType;
            }
        };
        $scope.deselect = function(index) {
            $scope.deselectTab = true;
        };
    })
    .controller('AdminFlowServerController', function($scope, $interval, $http, $state, $stateParams, $filter) {
        $scope.setTitle('流量统计');
        $scope.serverName = $stateParams.serverName;
        $scope.init = function() {
            if(!$scope.publicInfo.servers) {return;}
            $scope.servers = $scope.publicInfo.servers;
            if(!$stateParams.serverName && $state.current.name === 'admin.flow.server') {
                $state.go('admin.flow.server', {serverName: $scope.tabs[0].name});
            }
            if(!$stateParams.serverName) {$stateParams.serverName = $scope.tabs[0].name;}
            $scope.server = $scope.publicInfo.servers.filter(function(f, i) {
                if(f.name === $stateParams.serverName) {
                    $scope.tabIndex.value = i;
                    return true;
                }
            })[0];
            if(!$scope.server) {return $state.go('admin.index');}
            $scope.server.sum = {};
            $scope.server.sum.today = $scope.server.account.reduce(function(r, e) {
                if(e.today) {return r + e.today;}
                return r;
            }, 0);
            $scope.server.sum.week = $scope.server.account.reduce(function(r, e) {
                if(e.week) {return r + e.week;}
                return r;
            }, 0);
            $scope.server.sum.month = $scope.server.account.reduce(function(r, e) {
                if(e.month) {return r + e.month;}
                return r;
            }, 0);
            
        };
        $scope.init();
        $scope.$watch('publicInfo.servers', function() {
            $scope.init();
        }, false);

        $scope.accountPage = function(serverName, accountPort) {
            $scope.setMenuButtonHistoryBack();
            $state.go('admin.editAccount', {
                serverName: serverName,
                accountPort: accountPort
            });
        };

        var scaleLabel = function(chart) {
            var input = chart.value;
            if (input < 1000) {
                return input +' B';
            } else if (input < 1000000) {
                return (input/1000).toFixed(0) +' KB';
            } else if (input < 1000000000) {
                return (input/1000000).toFixed(0) +' MB';
            } else if (input < 1000000000000) {
                return (input/1000000000).toFixed(1) +' GB';
            } else {
                return input;
            }
        };
        $scope.chartType = 'hour';
        $scope.chartChange = function(type) {
            if(type === 'hour') {

                $scope.getChart($scope.flowChart[$stateParams.serverName].hour, 'hour');
            }
            if(type === 'day') {
                $scope.getChart($scope.flowChart[$stateParams.serverName].day, 'day');
            }
            if(type === 'week') {
                $scope.getChart($scope.flowChart[$stateParams.serverName].week, 'week');
            }
        };
        $scope.getChart = function(chart, type) {
            $http.post('/api/admin/flowChart', {
                server: $stateParams.serverName,
                port: 0,
                type: type,
                page: $scope.flowChart[$stateParams.serverName][type].page
            }).then(function(success) {
                chart.sum = 0;
                chart.startTime = success.data[0].time;
                chart.endTime = success.data[success.data.length - 1].time;
                chart.labels = [];
                chart.series = [];
                chart.data = [[]];
                success.data.forEach(function(f, i) {
                    if(type === 'week') {
                        chart.labels[i] = $filter('date')(f.time, 'EEE');
                    } else {
                        chart.labels[i] = (i%4===0)?$filter('date')(f.time, 'HH:mm'):'';
                    }
                    chart.data[0][i] = f.flow;
                    chart.sum += f.flow;
                });
                chart.options = {
                    pointHitDetectionRadius: 1,
                    scaleLabel: scaleLabel,
                    tooltipTemplate: scaleLabel
                };
            });
        };
        if(!$scope.flowChart[$stateParams.serverName]) {
            $scope.flowChart[$stateParams.serverName] = {
                hour: {page: 0},
                day: {page :0},
                week: {page: 0}
            };
        }

        $scope.prev = function() {
            $scope.flowChart[$stateParams.serverName][$scope.chartType].page += 1;
            $scope.getChart($scope.flowChart[$stateParams.serverName][$scope.chartType], $scope.chartType);
        };
        $scope.reset = function() {
            $scope.flowChart[$stateParams.serverName].hour.page = 0;
            $scope.flowChart[$stateParams.serverName].day.page = 0;
            $scope.flowChart[$stateParams.serverName].week.page = 0;
            $scope.getChart($scope.flowChart[$stateParams.serverName].hour, 'hour');
            $scope.getChart($scope.flowChart[$stateParams.serverName].day, 'day');
            $scope.getChart($scope.flowChart[$stateParams.serverName].week, 'week');
        };
        $scope.next = function() {
            if($scope.flowChart[$stateParams.serverName][$scope.chartType].page === 0) {
                return;
            }
            $scope.flowChart[$stateParams.serverName][$scope.chartType].page -= 1;
            $scope.getChart($scope.flowChart[$stateParams.serverName][$scope.chartType], $scope.chartType);
        };
        
        $scope.getChart($scope.flowChart[$stateParams.serverName].hour, 'hour');
        $scope.getChart($scope.flowChart[$stateParams.serverName].day, 'day');
        $scope.getChart($scope.flowChart[$stateParams.serverName].week, 'week');
    })
    .controller('AdminUserController', function($scope, $state, $http) {
        $scope.setTitle('用户管理');

        $scope.usersF = [];

        $scope.init = function() {
            if(!$scope.publicInfo.users) {return;}
            $scope.users = $scope.publicInfo.users;
            if(!$scope.usersF.length) {$scope.usersF = $scope.users;}
        };
        $scope.init();
        $scope.$watch('publicInfo.users', function() {
            $scope.init();
        }, false);

        $scope.userPage = function(userName) {
            $state.go('admin.userPage', {userName: userName});
        };

        $scope.publicInfo.search = true;
        $scope.$watch('publicInfo.searchText', function() {
            if(!$scope.users) {return;}
            if($scope.publicInfo.searchText === '') {$scope.usersF = $scope.users;}
            var reg = new RegExp($scope.publicInfo.searchText);
            $scope.usersF = $scope.users.filter(function(f) {
                return  f.email.match(reg);
            });
        });
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
        $scope.$watch('publicInfo.users', function() {
            $scope.init();
        }, false);

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
        $scope.$watch('publicInfo.servers', function() {
            $scope.init();
        }, false);

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
    .controller('AdminRenewController', function($scope, $http, $mdBottomSheet, $mdDialog) {
        $scope.setTitle('续费码');
        $scope.setFabButtonClick(function(){
            $scope.addCode();
        });

        $scope.type = {
            unuse: true,
            use : false
        };
        $scope.codeFilter = function() {
            $scope.codeF = $scope.codes.filter(function(f) {
                if(f.isUsed && $scope.type.use) {
                    return true;
                }
                if(!f.isUsed && $scope.type.unuse) {
                    return true;
                }
                return false;
            });
        };

        $scope.$watch('type', function() {
            if(!$scope.codes) {return;}
            $scope.codeFilter();
        }, true);

        $scope.init = function() {
            if(!$scope.publicInfo.codes) {return;}
            $scope.codes = $scope.publicInfo.codes;
            $scope.codeFilter();
        };
        $scope.init();
        $scope.$watch('publicInfo.codes', function() {
            $scope.init();
        }, false);

        $scope.newDate = function() {return new Date();};
        $scope.newCode = {
            flow: 0,
            time: 0,
            add: function(type, number) {
                if(type === 'flow') {
                    $scope.newCode.flow += number;
                    if($scope.newCode.flow < 0) {$scope.newCode.flow = 0;}
                }
                if(type === 'time') {
                    $scope.newCode.time += number;
                    if($scope.newCode.time < 0) {$scope.newCode.time = 0;}
                }
            },
            post: function() {
                $scope.loading(true);
                $http.post('/api/admin/code', {
                    flow: $scope.newCode.flow,
                    time: $scope.newCode.time
                }).then(function(success) {
                    $mdBottomSheet.cancel();
                    $scope.newCode.flow = 0;
                    $scope.newCode.time = 0;
                    $scope.loading(false);
                    $scope.publicInfo.codes.push(success.data);
                }, function(error) {
                    $mdBottomSheet.cancel();
                    $scope.loadingMessage({
                        message: '添加续费码失败',
                        right: function() {
                            $scope.loading(false);
                        }
                    });
                });
            }
        };
        $scope.addCode = function() {
            $mdBottomSheet.show({
                templateUrl: '/public/views/admin/addCode.html',
                preserveScope: true,
                scope: $scope,
                controller: function($scope) {}
            });
        };
        $scope.detail = function(code) {
            var dialog = $mdDialog.prompt({
                templateUrl: '/public/views/admin/renewCode.html',
                escapeToClose : true,
                clickOutsideToClose:true,
                locals: {code: code},
                controller: function($scope, code) {
                    $scope.code = code;
                }
            });
            $mdDialog.show(dialog);
        };
    })
    .controller('AdminUnfinishController', function($scope) {
        $scope.setTitle('404 Not Found');
    })
    .controller('AdminOptionsController', function($scope) {
        $scope.setTitle('系统设置');

        $scope.options = {
            freeServer: false
        };
    })
;