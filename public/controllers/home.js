var fingerprint = '';
new Fingerprint2().get(function(result, components){
    fingerprint = result;
});

app.controller('MainController', function($scope) {
        $scope.publicInfo = {};
    })
    .controller('LoginController', function($scope, $http, $state, $mdDialog, $mdToast, $window) {
        $scope.user = {
            username: '',
            password: '',
        };

        $scope.signup = function() {
            if(!$scope.user.username || !$scope.user.password) {
                $scope.loading(true);
                $scope.loading(true, '请填写完整的邮箱和密码，并点击“注册”按钮', function() {
                    $scope.loading(false);
                });
                return;
            }
            $scope.loading(true);
            $http.post('/api/home/signup', {
                username: $scope.user.username,
                password: $scope.user.password,
                fingerprint: fingerprint
            }).then(function(success) {
                $scope.loading(false);
                $scope.publicInfo.message = '注册成功，请前往邮箱激活此帐户';
                $state.go('home.signupSuccess');
            }, function(err) {
                $scope.loading(true, err.data || '发生未知错误', function() {
                    $scope.loading(false);
                });
            });
        };

        $scope.login = function() {
            if(!$scope.user.username || !$scope.user.password) {
                $scope.loading(true);
                $scope.loading(true, '请填写完整的邮箱和密码，并点击“登录”按钮', function() {
                    $scope.loading(false);
                });
                return;
            }
            $scope.loading(true);
            $http.post('/api/home/login', $scope.user).then(function(success) {
                $window.location.reload();
            }, function(err) {
                if(err.data === '该用户的邮箱未验证') {
                    $scope.customButton = '重发邮件';
                    $scope.customButtonFn = function() {
                        $scope.customButton = '';
                        $http.post('/api/home/email', {username: $scope.user.username});
                        $scope.loading(false);
                        $scope.customButtonFn = function() {};
                    };
                    $scope.loading(true, '该用户的邮箱未验证，如未收到激活邮件，请点击“重发邮件”按钮', function() {
                        $scope.loading(false);
                    });
                } else {
                    $scope.loading(true, err.data || '发生未知错误', function() {
                        $scope.loading(false);
                    });
                }
                
            });
        };

        $scope.passwordKeypress = function(e) {
            if(e.keyCode === 13) {
                $scope.login();
            }
        };

        $scope.isLoading = false;
        $scope.loadingText = '正在加载';
        $scope.loadingError = '';
        $scope.loadingErrorFn = function() {};
        $scope.customButton = '';
        $scope.customButtonFn = function() {};

        var dialog = $mdDialog.prompt({
            templateUrl: '/public/views/home/loading.html',
            escapeToClose : false,
            scope: $scope,
            preserveScope: true,
            controller: function($scope) {
                $scope.isLoading = true;
            }
        });

        $scope.loading = function(isLoading, error, fn) {
            if(isLoading) {
                if(!error) {
                    $mdDialog.show(dialog);
                } else {
                    $scope.loadingError = error;
                    $scope.loadingErrorFn = fn || function() {};
                }
            } else {
                var waitToCancel = $scope.$watch('isLoading', function() {
                    if($scope.isLoading) {
                        $mdDialog.cancel();
                        waitToCancel();
                        $scope.isLoading = false;
                        $scope.loadingText = '正在加载';
                        $scope.loadingError = '';
                        $scope.loadingErrorFn = function() {};
                    }
                });
            }
        };
    })
    .controller('SignupSuccessController', function($scope, $http, $interval, $state) {
        $scope.time = 10;
        var i = $interval(function() {
            $scope.time -= 0.1;
            $scope.timeStr = $scope.time.toString().split('.')[0];
            if($scope.time <= 0) {
                $scope.timeStr = '0';
                $interval.cancel(i);
                $state.go('home.index');
            }
        }, 100);
    })
    .controller('LoginActiveController', function($scope, $http, $interval, $state, $stateParams) {
        $http.post('/api/home/active', {activeKey: $stateParams.activeKey}).then(function(success) {
            $scope.publicInfo.message = '激活成功！';
            $state.go('home.signupSuccess');
        }, function(error) {
            $scope.publicInfo.message = '激活失败，请重发激活邮件';
            $state.go('home.signupSuccess');
        });
    })
;