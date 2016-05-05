app.controller('LoginController', function($scope, $http, $state, $mdToast, $window) {
    $scope.user = {
        username: '',
        password: ''
    };

    $scope.signup = function() {
        if(!$scope.user.username || !$scope.user.password) {return;}
        $http.post('/user/signup', $scope.user).success(function(data) {
            $state.go('home.signupSuccess');
        }).error(function(err) {
            $scope.showActionToast(err || '发生未知错误');
        });
    };

    $scope.login = function() {
        $http.post('/user/login', $scope.user).success(function(data) {
            $window.location.reload();
        }).error(function(err) {
            $scope.showActionToast(err || '发生未知错误');
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