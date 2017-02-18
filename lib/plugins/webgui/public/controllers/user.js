const app = require('../index').app;

app
.controller('UserController', ['$scope', '$mdMedia', '$mdSidenav', '$state', '$http',
  ($scope, $mdMedia, $mdSidenav, $state, $http) => {
    $http.get('/api/home/login').then(success => {
      if(success.data.status !== 'normal') {
        $state.go('home.index');
      } else {
        $scope.setMainLoading(false);
      }
    });
    $scope.innerSideNav = true;
    $scope.menuButton = function() {
      if ($mdMedia('gt-sm')) {
        $scope.innerSideNav = !$scope.innerSideNav;
      } else {
        $mdSidenav('left').toggle();
      }
    };
    $scope.menus = [{
      name: '首页',
      icon: 'home',
      click: 'user.index'
    }, {
      name: '我的账号',
      icon: 'account_circle',
      click: 'user.account'
    }, {
      name: 'divider',
    }, {
      name: '退出',
      icon: 'settings',
      click: function() {
        $http.post('/api/home/logout');
        $state.go('home.index');
      },
    }];
    $scope.menuClick = (index) => {
      $mdSidenav('left').close();
      if(typeof $scope.menus[index].click === 'function') {
        $scope.menus[index].click();
      } else {
        $state.go($scope.menus[index].click);
      }
    };
    $scope.title = '';
    $scope.setTitle = str => { $scope.title = str; };
    $scope.$on('$stateChangeStart', function(event, toUrl, fromUrl) {
      $scope.title = '';
    });
    // $scope.ws = ws;
  }
])
.controller('UserIndexController', ['$scope', '$state',
  ($scope, $state) => {
    $scope.setTitle('首页');
    $scope.toMyAccount = () => {
      $state.go('user.account');
    };
  }
])
.controller('UserAccountController', ['$scope', '$http', '$mdMedia', 'userApi', '$mdDialog', 'alertDialog', 'payDialog', '$interval',
  ($scope, $http, $mdMedia, userApi, $mdDialog, alertDialog, payDialog, $interval) => {
    $scope.setTitle('我的账号');
    $scope.flexGtSm = 100;
    userApi.getUserAccount().then(success => {
      $scope.account = success.account;
      $scope.servers = success.servers;
      if($scope.account.length >= 2) {
        $scope.flexGtSm = 50;
      }
    });
    const base64Encode = (str) => {
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
      }));
    };
    $scope.createQrCode = (method, password, host, port) => {
      return 'ss://' + base64Encode(method + ':' + password + '@' + host + ':' + port);
    };
    $scope.getServerPortData = (account, serverId, port) => {
      if(account.type >= 2 && account.type <= 5) {
        $http.get(`/api/user/flow/${ serverId }/${ port }`).then(success => {
          account.serverPortFlow = success.data[0];
        });
      }
      $http.get(`/api/user/flow/${ serverId }/${ port }/lastConnect`).then(success => {
        account.lastConnect = success.data.lastConnect;
      });
    };
    $scope.getQrCodeSize = () => {
      if($mdMedia('xs')) {
        return 230;
      }
      return 180;
    };
    $scope.showChangePasswordDialog = (accountId, password) => {
      const dialog = {
        templateUrl: '/public/views/user/changePassword.html',
        escapeToClose: false,
        locals: { bind: password },
        bindToController: true,
        controller: ['$scope', 'userApi', '$mdDialog', 'bind', function($scope, userApi, $mdDialog, bind) {
          $scope.account = {
            password: bind,
          };
          $scope.changePassword = () => {
            $mdDialog.cancel();
            // $http.put(`/api/user/${ accountId }/password`, {
            //   password: $scope.account.password,
            // });
            userApi.changePassword(accountId, $scope.account.password);
          };
        }],
        clickOutsideToClose: true,
      };
      $mdDialog.show(dialog);
    };
    $scope.createOrder = (accountId) => {
      payDialog.loading();
      $http.post('/api/user/order/qrcode', {
        accountId,
      }).then(success => {
        payDialog.setUrl(success.data.orderId, success.data.qrCode);
      }).catch(console.log);
    };
    $scope.fontColor = (time) => {
      if(time >= Date.now()) {
        return {
          color: '#333',
        };
      }
      return {
        color: '#a33',
      };
    };
    $scope.unfinish = () => {
      alertDialog.show('该功能尚未完成', '确定');
    };
  }
]);
