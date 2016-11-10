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
    var oldConfig = '';
    var newConfig = '';
    $scope.config = {
      shadowsocks: {
        flow: 100,
        time: 100,
      }
    };
    $scope.getConfig = function () {
      $http.post('/config').then(function(success) {
        $scope.config = success.data;
        oldConfig = JSON.stringify($scope.config);
        newConfig = JSON.stringify($scope.config);
      });
    };
    $scope.getConfig();
    $scope.back = function () {
      interval && $interval.cancel(interval);
      $scope.setConfig();
      $state.go('index');
    };
    $scope.setConfig = function () {
      if(newConfig === oldConfig) {
        return;
      }
      oldConfig = newConfig;
      $http.put('/config', {
        shadowsocks: $scope.config.shadowsocks,
      });
    };
    var interval = $interval(function() {
      newConfig = JSON.stringify($scope.config);
      $scope.setConfig();
    }, 1000);
  })
;
