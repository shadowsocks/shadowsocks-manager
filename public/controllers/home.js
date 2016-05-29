app.controller('MainController', function($scope) {
        $scope.publicInfo = {};
    })
    .controller('LoginController', function($scope, $http, $state, $mdDialog, $mdToast, $window) {
        $scope.user = {
            username: '',
            password: ''
        };

        $scope.signup = function() {
            if(!$scope.user.username || !$scope.user.password) {return;}
            $scope.loading(true);
            $http.post('/user/signup', $scope.user).then(function(success) {
                $scope.loading(false);
                $scope.publicInfo.message = '注册成功！';
                $state.go('home.signupSuccess');
            }, function(err) {
                $scope.loading(true, err.data || '发生未知错误', function() {
                    $scope.loading(false);
                });
            });
        };

        $scope.login = function() {
            $scope.loading(true);
            $http.post('/user/login', $scope.user).then(function(success) {
                $window.location.reload();
            }, function(err) {
                if(err.data === '该用户的邮箱未验证') {
                    $scope.customButton = '重发邮件';
                    $scope.customButtonFn = function() {
                        $scope.customButton = '';
                        $http.post('/home/email', {username: $scope.user.username});
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
        $scope.time = 5;
        $interval(function() {
            $scope.time--;
            if($scope.time === 0) {
                $state.go('home.index');
            }
        }, 1000);
    })
    .controller('LoginActiveController', function($scope, $http, $interval, $state, $stateParams) {
        $http.post('/home/active', {activeKey: $stateParams.activeKey}).then(function(success) {
            $scope.publicInfo.message = '激活成功！';
            $state.go('home.signupSuccess');
        });
    })
;