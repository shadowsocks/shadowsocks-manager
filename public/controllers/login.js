app.controller('LoginController', function($scope, $http, $state) {
    $scope.user = {
        username: '',
        password: ''
    };

    $scope.signup = function() {
        if(!$scope.user.username || !$scope.user.password) {return;}
        $http.post('/user/signup', $scope.user).success(function(data) {
            $state.go('index.signupSuccess');
        });
    };

    $scope.login = function() {
        $http.post('/user/login', $scope.user).success(function(data) {
            console.log(data);
        });
    };
})
.controller('SignupSuccessController', function($scope, $http, $interval, $state) {
    $scope.time = 5;
    $interval(function() {
        $scope.time--;
        if($scope.time === 0) {
            $state.go('index.login');
        }
    }, 1000);
})
;