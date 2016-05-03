

app.controller('LoginController', function($scope, $http) {
    $scope.user = {
        username: '',
        password: ''
    };

    $scope.signup = function() {
        console.log($scope.user);
        if(!$scope.user.username || !$scope.user.password) {return;}
        $http.post('/user/signin', $scope.user);
    };

    $scope.login = function() {

    };
});