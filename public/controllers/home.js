app.controller('LoginController', function($scope, $http, $state, $mdDialog, $mdToast, $window) {
    $scope.user = {
        username: '',
        password: ''
    };

    $scope.signup = function() {
        if(!$scope.user.username || !$scope.user.password) {return;}
        $scope.loading(true);
        $http.post('/user/signup', $scope.user).then(function(success) {
            $scope.loading(false);
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
            $scope.loading(true, err.data || '发生未知错误', function() {
                $scope.loading(false);
            });
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
;