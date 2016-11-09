app
  .controller('PasswordController', function($scope, $http, $state) {
    $scope.back = function () {
      $state.go('index');
    };
  })
;
