const app = require('../index').app;

app.controller('AdminController', ['$scope', '$mdMedia', '$mdSidenav', '$state', '$http',
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
      click: 'admin.index',
    }, {
      name: '服务器',
      icon: 'cloud',
      click: 'admin.server',
    }, {
      name: '用户',
      icon: 'people',
      click: 'admin.user',
    }, {
      name: '账号',
      icon: 'account_circle',
      click: 'admin.account',
    }, {
      name: '续费码',
      icon: 'attach_money',
      click: 'admin.server',
    }, {
      name: '设置',
      icon: 'settings',
      click: 'admin.server',
    }, {
      name: '退出',
      icon: 'exit_to_app',
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
    $scope.fabButton = false;
    $scope.fabButtonClick = () => {};
    $scope.setFabButton = (fn) => {
      $scope.fabButton = true;
      $scope.fabButtonClick = fn;
    };
    $scope.$on('$stateChangeStart', function(event, toUrl, fromUrl) {
      $scope.fabButton = false;
    });
  }
]).controller('AdminIndexController', ['$scope',
  ($scope) => {
    console.log('Index');
  }
]).controller('AdminServerController', ['$scope', '$http', '$state',
  ($scope, $http, $state) => {
    $http.get('/api/admin/server').then(success => {
      $scope.servers = success.data;
    });
    $scope.toServerPage = (serverId) => {
      $state.go('admin.serverPage', { serverId });
    };
    $scope.setFabButton(() => {
      $state.go('admin.addServer');
    });
  }
]).controller('AdminServerPageController', ['$scope', '$state', '$stateParams', '$http',
  ($scope, $state, $stateParams, $http) => {
    $http.get('/api/admin/server/' + $stateParams.serverId).then(success => {
      $scope.server = success.data;
    });
  }
]).controller('AdminAddServerController', ['$scope', '$state', '$stateParams', '$http',
  ($scope, $state, $stateParams, $http) => {
    $scope.server = {};
    $scope.confirm = () => {
      $http.post('/api/admin/server', {
        name: $scope.server.name,
        address: $scope.server.address,
        port: +$scope.server.port,
        password: $scope.server.password,
      }).then(success => {
        $state.go('admin.server');
      });
    };
    $scope.cancel = () => {
      $state.go('admin.server');
    };
  }
]).controller('AdminUserController', ['$scope', '$state', '$stateParams', '$http',
  ($scope, $state, $stateParams, $http) => {
    // $http.get('/api/admin/server/' + $stateParams.serverId).then(success => {
    //   $scope.server = success.data;
    // });
  }
]).controller('AdminAccountController', ['$scope', '$state', '$stateParams', '$http',
  ($scope, $state, $stateParams, $http) => {
    $scope.setFabButton(() => {
      $state.go('admin.addAccount');
    });
  }
]).controller('AdminAddAccountController', ['$scope', '$state', '$stateParams', '$http',
  ($scope, $state, $stateParams, $http) => {
    $scope.account = {};
    $scope.confirm = () => {
      $http.post('/api/admin/account', {
        port: +$scope.account.port,
        password: $scope.account.password,
      }).then(success => {
        $state.go('admin.account');
      });
    };
  }
]);
