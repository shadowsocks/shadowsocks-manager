app
  .controller('PasswordController', function($scope, $http, $state) {
    $scope.user = {};
    $scope.back = function () {
      $state.go('index');
    };
    $scope.checkPassword = function () {
      $http.post('/password', {
        password: $scope.user.password
      }).then(function() {
        $state.go('manager');
      });
    };
  })
  .controller('ManagerController', function($scope, $http, $state, $interval) {
    $scope.config = {
      shadowsocks: {
        flow: 100,
        time: 100,
      }
    };
    $scope.getConfig = function () {
      $http.post('/config').then(function(success) {
        $scope.config = success.data;
      });
    };
    $scope.getConfig();
    $scope.back = function () {
      interval && $interval.cancel(interval);
      $scope.setConfig();
      $state.go('index');
    };
    $scope.setConfig = function () {
      $http.put('/config', {
        shadowsocks: $scope.config.shadowsocks,
      });
    };
    var interval = $interval(function() {
      $scope.setConfig();
    }, 1000);
  })
;
