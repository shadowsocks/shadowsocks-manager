app.controller('UserIndexController', function($scope, $http, $state) {
        $scope.setTitle('首页');
        $scope.setMenuButton('default');
        $scope.logout = function() {
            $http.post('/api/home/logout');
        };
    })
    .controller('UserAccountController', function($scope, $http, $state) {
        $scope.setTitle('我的帐户');
        $scope.setMenuButton('default');
        $scope.accountPage = function(account) {
            $state.go('user.accountPage', {
                serverName: account.server,
                accountPort: account.port
            });
        };
    })
    .controller('UserAccountPageController', function($scope, $http, $state, $stateParams) {
        $scope.setTitle('帐户详情');
        $scope.setMenuButton('user.account');

        $scope.qrCode = '';
        var b64EncodeUnicode = function(str) {
            return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
                return String.fromCharCode('0x' + p1);
            }));
        };

        $scope.$watch('publicInfo', function() {
            $scope.init();
        }, true);

        $scope.init = function() {
            if(!$scope.publicInfo.user) {return;}
            $scope.account = $scope.publicInfo.user.account.filter(function(f) {
                return (f.server === $stateParams.serverName && +f.port === +$stateParams.accountPort);
            })[0];
            if(!$scope.account) {
                return $state.go('user.index');
            }
            $scope.qrCode = 'ss://' + b64EncodeUnicode($scope.account.method + ':' + $scope.account.password + '@' + $scope.account.address + ':' + $scope.account.port);
        };
        $scope.init();
    })
    .controller('UserChangePasswordController', function($scope, $http, $state, $window) {
        $scope.setTitle('修改密码');

        $scope.password = {};
        $scope.changePassword = function() {
            $scope.loading(true);
            $http.put('/api/user/password', $scope.password)
            .then(function(success) {
                $scope.loadingMessage({
                    message: '修改密码成功，点确定重新登陆',
                    right: function() {
                        $window.location.reload();
                    }
                });
            }, function(error) {
                $scope.loadingMessage({
                    message: '修改密码失败(' + error.status + ')',
                    right: function() {
                        $scope.loading(false);
                    }
                });
            });
        };
    })
    .controller('UserUnfinishController', function($scope) {
        $scope.setTitle('404 Not Found');
    })
;