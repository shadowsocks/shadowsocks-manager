app
  .controller('PasswordController', function($scope, $http, $state) {
    $scope.user = {};
    $scope.back = function () {
      $state.go('index');
    };
    $scope.checkPassword = function () {
      $http.post('/password', {
        password: $scope.user.password
      }).then(console.log);
    };
  })
;
