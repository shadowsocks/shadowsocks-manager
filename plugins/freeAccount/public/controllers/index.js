app
  .filter('flow1024', function() {
    return function(input) {
      if (input < 1000) {
        return input + ' B';
      } else if (input < 1000000) {
        return (input / 1000).toFixed(1) + ' KB';
      } else if (input < 1000000000) {
        return (input / 1000000).toFixed(1) + ' MB';
      } else if (input < 1000000000000) {
        return (input / 1000000000).toFixed(2) + ' GB';
      } else {
        return input;
      }
    };
  }).filter('relativeTime', function() {
    function relativeTime(input) {
      var ret = '';
      var retTail = '';

      var time = (+new Date()) - (new Date(input));
      if (time < 0) {
        time = -time;
      } else retTail = '前';

      var day = Math.trunc(time / (24 * 3600 * 1000));
      var hour = Math.trunc(time % (24 * 3600 * 1000) / (3600 * 1000));
      var minute = Math.trunc(time % (24 * 3600 * 1000) % (3600 * 1000) / (60 * 1000));
      if (day) {
        ret += day + '天';
      }
      if (day || hour) {
        ret += hour + '小时';
      }
      if (!day && (hour || minute)) {
        ret += minute + '分钟';
      }
      if (time < (60 * 1000)) {
        ret = '几秒';
      }

      return ret + retTail;
    };
    relativeTime.$stateful = true;
    return relativeTime;
  });
app
  .controller('MainController', function($scope, $http, $state) {
    $scope.isLoading = false;
    $scope.loading = function (isLoading) {
      $scope.isLoading = isLoading;
    };
    $scope.back = function () {
      $state.go('index');
    };
    $scope.title = '';
    $scope.setTitle = function (title) {
      $scope.title = title;
    };
    $scope.setBackButton = function (fn) {
      $scope.back = fn;
    };
    $scope.menus = [];
    $scope.setMenu = function(menus) {
      $scope.menus = menus;
    };
  })
  .controller('IndexController', function($scope, $http, $state, $mdDialog) {
    $scope.setTitle('F');
    $scope.setMenu([{
      icon: 'settings',
      text: '管理',
      click: function() {
        $http.post('/config').then(function() {
          $state.go('manager');
        }).catch(function() {
          $state.go('password');
        });
      }
    }, {
      icon: 'info_outline',
      text: '关于',
      click: function() {
        $state.go('about');
      }
    }]);
    $scope.showAlert = function(title, text) {
      $mdDialog.show(
        $mdDialog.alert()
        .parent(angular.element(document.querySelector('#popupContainer')))
        .clickOutsideToClose(true)
        .title(title)
        .textContent(text)
        .ariaLabel('alert')
        .ok('确定')
      );
    };
    $scope.user = {};
    $scope.sendCode = function() {
      $http.post('/email', {
        email: $scope.user.email
      }).then(function(success) {
        $scope.showAlert('提示', '验证码发送成功。');
      }).catch(function(error) {
        $scope.showAlert('错误', '验证码发送失败。');
      });
    };
    $scope.checkCode = function() {
      $http.post('/code', {
        email: $scope.user.email,
        code: $scope.user.code
      }).then(function(success) {
        $state.go('account', {
          id: success.data
        });
      }).catch(function(error) {
        $scope.showAlert('错误', '验证失败。');
      });
    };
    $scope.manager = function () {
      $http.post('/config').then(function() {
        $state.go('manager');
      }).catch(function() {
        $state.go('password');
      });
    };
    $scope.about = function () {
      $state.go('about');
    };
  })
  .controller('AccountController', function($scope, $http, $state, $stateParams, $interval) {
    $scope.qrcode = '';
    var b64EncodeUnicode = function(str) {
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
      }));
    };
    $scope.getAccount = function() {
      $http.post('/account', {
        address: $stateParams.id
      }).then(function(success) {
        $scope.accountInfo = success.data;
        $scope.qrcode = 'ss://' + b64EncodeUnicode($scope.accountInfo.method + ':' + $scope.accountInfo.password + '@' + $scope.accountInfo.host + ':' + $scope.accountInfo.port);
      }, function(error) {
        console.log(error);
        interval && $interval.cancel(interval);
        $state.go('index');
      });
    };
    $scope.getAccount();
    var interval = $interval(function() {
      $scope.getAccount();
    }, 60 * 1000);
  })
  .controller('AboutController', function($scope, $http, $state) {
    $scope.back = function () {
      $state.go('index');
    };
  });
