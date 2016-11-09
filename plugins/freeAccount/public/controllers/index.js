app
.filter('flow1024', function() {
  return function(input) {
    if (input < 1000) {
      return input +' B';
    } else if (input < 1000000) {
      return (input/1000).toFixed(1) +' KB';
    } else if (input < 1000000000) {
      return (input/1000000).toFixed(1) +' MB';
    } else if (input < 1000000000000) {
      return (input/1000000000).toFixed(2) +' GB';
    } else {
      return input;
    }
  };
}).filter('relativeTime', function() {
  return function(input) {
    var ret = '';
    var retTail = '';

    var time = (+new Date()) - (new Date(input));
    if(time < 0) {time = -time;}
    else retTail = '前';

    var day = Math.trunc(time/(24 * 3600 * 1000));
    var hour = Math.trunc(time%(24 * 3600 * 1000)/(3600* 1000));
    var minute = Math.trunc(time%(24 * 3600 * 1000)%(3600* 1000)/(60 * 1000));
    if(day) {ret += day + '天';}
    if(day || hour) {ret += hour + '小时';}
    if(!day && (hour || minute)) {ret += minute + '分钟';}
    if(time < (60 * 1000)) {ret = '几秒';}

    return ret + retTail;
  };
});
app
  .controller('MainController', function($scope, $http, $state) {
    console.log('main');
    $state.go('index');
  })
  .controller('IndexController', function($scope, $http, $state, $mdDialog) {
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
       $state.go('account', {id: success.data});
     }).catch(function(error) {
       $scope.showAlert('错误', '验证失败。');
     });
    };
  })
  .controller('AccountController', function($scope, $http, $state, $stateParams, $interval) {
    console.log($stateParams.id);
    $scope.qrcode = '';
    var b64EncodeUnicode = function (str) {
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
      }));
    };
    $scope.getAccount = function() {
      $http.post('/account', {address: $stateParams.id}).then(function(success) {
        console.log(success.data);
        $scope.accountInfo = success.data;
        $scope.qrcode = 'ss://' + b64EncodeUnicode($scope.accountInfo.method + ':' + $scope.accountInfo.password + '@' + $scope.accountInfo.host + ':' + $scope.accountInfo.port);
      }, function(error) {
        console.log(error);
        interval && interval.cancel && interval.cancel();
        $state.go('index');
      });
    };
    $scope.getAccount();
    var interval = $interval(function() {
      $scope.getAccount();
    }, 60 * 1000);
  })
;
