const app = require('../index').app;

app.controller('HomeController', ['$scope', '$mdMedia', '$mdSidenav',
  ($scope, $mdMedia, $mdSidenav) => {
    console.log('Home');
    $scope.innerSideNav = true;
    $scope.menuButton = function() {
        if($mdMedia('gt-sm')) {
            $scope.innerSideNav = !$scope.innerSideNav;
        } else {
            $mdSidenav('left').toggle();
        }
    };
    $scope.menus = [
        {name: '首页', icon: 'home', click: 'admin.index'},
        {name: '服务器管理', icon: 'cloud', click: 'admin.server'},
        {name: '用户管理', icon: 'face', click: 'admin.user'},
        {name: '续费码', icon: 'shop', click: 'admin.renew'},
        {name: '流量统计', icon: 'timeline', click: 'admin.flow.server'},
        {name: '系统设置', icon: 'settings', click: 'admin.options'}
    ];
  }
]).controller('IndexController', ['$scope',
  ($scope) => {
    console.log('Index');
  }
]).controller('LoginController', ['$scope',
  ($scope) => {
    console.log('Login');
  }
]);
