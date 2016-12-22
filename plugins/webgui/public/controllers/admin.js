const app = require('../index').app;

app.controller('AdminController', ['$scope', '$mdMedia', '$mdSidenav', '$state', '$http',
  ($scope, $mdMedia, $mdSidenav, $state, $http) => {
    console.log('Home');
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
      click: 'admin.index'
    },{
      name: '服务器管理',
      icon: 'home',
      click: 'admin.server'
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
]).controller('AdminIndexController', ['$scope',
  ($scope) => {
    console.log('Index');
  }
]).controller('AdminServerController', ['$scope', '$http', '$state',
  ($scope, $http, $state) => {
    $http.get('/api/admin/server').then(success => {
      $scope.servers = success.data;
      $scope.servers[1] = $scope.servers[0];
      $scope.servers[2] = $scope.servers[0];
    });
    $scope.toServerPage = (serverName) => {
      $state.go('admin.serverPage', { serverName });
    };
  }
]).controller('AdminServerPageController', ['$scope', '$state', '$stateParams', '$http',
  ($scope, $state, $stateParams, $http) => {
    $http.get('/api/admin/server/' + $stateParams.serverName).then(success => {
      $scope.server = success.data;
    });
  }
]);
