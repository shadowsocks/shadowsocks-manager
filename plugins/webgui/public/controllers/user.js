const app = require('../index').app;

app.controller('UserController', ['$scope', '$mdMedia', '$mdSidenav', '$state',
  ($scope, $mdMedia, $mdSidenav, $state) => {
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
      click: 'home.index'
    }, {
      name: '登录',
      icon: 'cloud',
      click: 'home.login'
    }, {
      name: '注册帐号',
      icon: 'face',
      click: 'home.signup'
    }, {
      name: '续费码',
      icon: 'shop',
      click: 'admin.renew'
    }, {
      name: '流量统计',
      icon: 'timeline',
      click: 'admin.flow.server'
    }, {
      name: '系统设置',
      icon: 'settings',
      click: 'admin.options'
    }];
    $scope.menuClick = (index) => {
      $mdSidenav('left').close();
      $state.go($scope.menus[index].click);
    };
  }
]).controller('UserIndexController', ['$scope',
  ($scope) => {
    console.log('Index');
  }
]);
