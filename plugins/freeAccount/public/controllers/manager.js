const app = require('../index').app;

app
  .controller('PasswordController', ['$scope', '$http', '$state', ($scope, $http, $state) => {
    $scope.setMenu([]);
    $scope.user = {};
    $scope.checkPassword = () => {
      $scope.loading(true);
      $http.post('/password', {
        password: $scope.user.password
      }).then(() => {
        $state.go('manager');
      }).catch(() => {
        $scope.loading(false);
        $scope.showAlert('错误', '管理员密码验证失败。');
      });
    };
    $scope.passwordKeypress = e => {
      if(e.keyCode === 13 && $scope.user.password) {
        $scope.checkPassword();
      }
    };
  }])
  .controller('ManagerController', ['$scope', '$http', '$state', '$interval', '$timeout', ($scope, $http, $state, $interval, $timeout) => {
    const menu = function() {
      $scope.setMenu([{
        icon: 'person',
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
    };
    $timeout(() => { menu(); }, 250);
    let oldConfig = '';
    let newConfig = '';
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
    $scope.getConfig = () => {
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
    $scope.setBackButton(() => {
      interval && $interval.cancel(interval);
      $scope.setConfig();
      $state.go('index');
    });
    $scope.setConfig = () => {
      if(newConfig === oldConfig) { return; }
      oldConfig = newConfig;
      $http.put('/config', $scope.config);
    };
    const interval = $interval(() => {
      if($scope.isLoading) { return; }
      newConfig = JSON.stringify($scope.config);
      $scope.setConfig();
    }, 1000);
    $scope.setInterval(interval);
  }])
  .controller('UserController', ['$scope', '$http', '$state', '$interval', '$timeout', ($scope, $http, $state, $interval, $timeout) => {
    const menu = () => {
      $scope.setMenu([{
        icon: 'build',
        text: '配置',
        click: function () {
          $state.go('manager');
        },
      },{
        icon: 'exit_to_app',
        text: '退出',
        click: function() {
          $http.post('/logout').then(function() {
            $state.go('index');
          });
        }
      }]);
    };
    $timeout(() => { menu(); }, 250);
    $scope.getUser = () => {
      $scope.users || $scope.loading(true);
      $http.post('/user')
      .then(success => {
        $scope.users = success.data;
        return $http.post('/flow');
      }).then(success => {
        $scope.flow = success.data.flow;
        $scope.loading(false);
      }).catch(error => {
        $scope.loading(false);
        if(error.status === 401) {
          $state.go('password');
        }
      });
    };
    $scope.getUser();
    const interval = $interval(() => {
      $scope.getUser();
    }, 60 * 1000);
    $scope.setInterval(interval);
    $scope.toAccount = address => {
      $state.go('account', {
        id: address,
      });
    };
  }])
;
