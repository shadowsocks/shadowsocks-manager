app
  .controller('PasswordController', function($scope, $http, $state) {
    $scope.setMenu([]);
    $scope.user = {};
    $scope.checkPassword = function () {
      $scope.loading(true);
      $http.post('/password', {
        password: $scope.user.password
      }).then(function() {
        $state.go('manager');
      }).catch(function() {
        $scope.loading(false);
        $scope.showAlert('错误', '管理员密码验证失败。');
      });
    };
    $scope.passwordKeypress = function(e) {
      if(e.keyCode === 13 && $scope.user.password) {
        $scope.checkPassword();
      }
    };
  })
  .controller('ManagerController', function($scope, $http, $state, $interval) {
    $scope.setMenu([{
      icon: 'exit_to_app',
      text: '用户',
      click: function () {
        $state.go('user');
      },
    },{
      icon: 'exit_to_app',
      text: '退出',
      click: function() {
        $http.post('/logout').then(function() {
          // interval && $interval.cancel(interval);
          $scope.setConfig();
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
      },
      limit: {
        user: { day: 0, week: 0, month: 0 },
        global: { day: 0, week: 0, month: 0 },
      },
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
    $scope.setBackButton(function () {
      interval && $interval.cancel(interval);
      $scope.setConfig();
      $state.go('index');
    });
    $scope.setConfig = function () {
      if(newConfig === oldConfig) {
        return;
      }
      oldConfig = newConfig;
      $http.put('/config', $scope.config);
    };
    var interval = $interval(function() {
      if($scope.isLoading) {
        return;
      }
      newConfig = JSON.stringify($scope.config);
      $scope.setConfig();
    }, 1000);
    $scope.setInterval(interval);
  })
  .controller('UserController', function($scope, $http, $state) {
    
  })
;
