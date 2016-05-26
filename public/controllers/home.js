app.controller('LoginController', function($scope, $http, $state, $mdDialog, $mdToast, $window) {
    $scope.user = {
        username: '',
        password: ''
    };

    $scope.signup = function() {
        if(!$scope.user.username || !$scope.user.password) {return;}
        $http.post('/user/signup', $scope.user).success(function(data) {
            $state.go('home.signupSuccess');
        }).error(function(err) {
            // $scope.showActionToast(err || '发生未知错误');
        });
    };

    $scope.login = function() {
        $scope.loading(true);
        $http.post('/user/login', $scope.user).success(function(data) {
            $window.location.reload();
        }).error(function(err) {
            $scope.loading(true, err || '发生未知错误', function() {
                $scope.loading(false);
            });
            // $scope.showActionToast(err || '发生未知错误');
        });
    };

    $scope.showActionToast = function(message) {
        var toast = $mdToast.simple()
            .textContent(message)
            .action('确定')
            .highlightAction(false)
            .position('bottom right');
        $mdToast.show(toast);
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