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
        $http.post('/api/logout');
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
  }
])
.controller('UserIndexController', ['$scope',
  ($scope) => {
  }
])
.controller('UserAccountController', ['$scope', '$http',
  ($scope, $http) => {
    $http.get('/api/user/account').then(success => {
      $scope.account = success.data;
    });
    $http.get('/api/user/server').then(success => {
      $scope.servers = success.data;
    });
  }
]);
