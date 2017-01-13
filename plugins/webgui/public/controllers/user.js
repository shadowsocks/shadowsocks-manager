const app = require('../index').app;

app.controller('UserController', ['$scope', '$mdMedia', '$mdSidenav', '$state', '$http',
  ($scope, $mdMedia, $mdSidenav, $state, $http) => {
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
  }
])
.controller('UserIndexController', ['$scope',
  ($scope) => {
    $scope.setTitle('首页');
  }
])
.controller('UserAccountController', ['$scope', '$http',
  ($scope, $http) => {
    $scope.setTitle('我的账号');
    $http.get('/api/user/account').then(success => {
      $scope.account = success.data;
      $scope.account.forEach(f => {
        f.data = JSON.parse(f.data);
      });
    });
    $http.get('/api/user/server').then(success => {
      $scope.servers = success.data;
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
      $http.get(`/api/user/flow/${ serverId }/${ port }`).then(success => {
        account.serverPortFlow = success.data[0];
      });
      $http.get(`/api/user/flow/${ serverId }/${ port }/lastConnect`).then(success => {
        account.lastConnect = success.data.lastConnect;
      });
    };
  }
]);
