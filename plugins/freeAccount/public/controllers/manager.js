app
  .controller('PasswordController', function($scope, $http, $state) {
    $scope.setMenu([]);
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
    $scope.setMenu([{
      icon: 'exit_to_app',
      text: '退出',
      click: function() {
        $http.post('/logout').then(function() {
          $state.go('index');
        });
      }
    }]);
    var oldConfig = '';
    var newConfig = '';
    $scope.config = {
      shadowsocks: {
        flow: 300,
        time: 120,
      }
    };
    $scope.getConfig = function () {
      $scope.loading(true);
      $http.post('/config').then(function(success) {
        $scope.loading(false);
        $scope.config = success.data;
        oldConfig = JSON.stringify($scope.config);
        newConfig = JSON.stringify($scope.config);
      }).catch(function(error) {
        $scope.loading(false);
        if(error.status === 401) {
          $state.go('password');
        }
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
      if($scope.isLoading) {
        return;
      }
      newConfig = JSON.stringify($scope.config);
      $scope.setConfig();
    }, 1000);
  })
;
