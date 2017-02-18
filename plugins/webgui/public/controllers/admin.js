const app = require('../index').app;

app.controller('AdminController', ['$scope', '$mdMedia', '$mdSidenav', '$state', '$http', '$sessionStorage',
  ($scope, $mdMedia, $mdSidenav, $state, $http, $sessionStorage) => {
    $sessionStorage.$default({
      settings: {},
    });
    $http.get('/api/home/login').then(success => {
      if(success.data.status !== 'admin') {
        $state.go('home.index');
      } else {
        $scope.setMainLoading(false);
      }
    });
    $scope.innerSideNav = true;
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
      name: '续费',
      icon: 'attach_money',
      click: 'admin.pay',
    }, {
      name: '设置',
      icon: 'settings',
      click: 'admin.unfinished',
    }, {
      name: 'divider',
    }, {
      name: '退出',
      icon: 'exit_to_app',
      click: function() {
        $http.post('/api/home/logout');
        $state.go('home.index');
      },
    }];
    $scope.menuButton = function() {
      if($scope.menuButtonIcon) {
        return $scope.menuButtonClick();
      }
      if ($mdMedia('gt-sm')) {
        $scope.innerSideNav = !$scope.innerSideNav;
      } else {
        $mdSidenav('left').toggle();
      }
    };
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
    $scope.fabButton = false;
    $scope.fabButtonClick = () => {};
    $scope.setFabButton = (fn) => {
      $scope.fabButton = true;
      $scope.fabButtonClick = fn;
    };
    $scope.menuButtonIcon = '';
    $scope.menuButtonClick = () => {};
    $scope.setMenuButton = (icon, fn) => {
      $scope.menuButtonIcon = icon;
      $scope.menuButtonClick = fn;
    };
    $scope.menuRightButtonIcon = '';
    $scope.menuRightButtonClick = () => {
      $scope.$broadcast('RightButtonClick', 'click');
    };
    $scope.setMenuRightButton = (icon) => {
      $scope.menuRightButtonIcon = icon;
    };
    $scope.menuSearchButtonIcon = '';
    $scope.menuSearch = {
      input: false,
      text: '',
    };
    $scope.menuSearchButtonClick = () => {
      $scope.menuSearch.input = true;
    };
    $scope.setMenuSearchButton = (icon) => {
      $scope.menuSearchButtonIcon = icon;
    };
    $scope.cancelSearch = () => {
      $scope.menuSearch.text = '';
      $scope.menuSearch.input = false;
      $scope.$broadcast('cancelSearch', 'cancel');
    };
    $scope.$on('$stateChangeStart', function(event, toUrl, fromUrl) {
      $scope.fabButton = false;
      $scope.title = '';
      $scope.menuButtonIcon = '';
      $scope.menuRightButtonIcon = '';
      $scope.menuSearchButtonIcon = '';
      $scope.menuSearch.text = '';
      $scope.menuSearch.input = false;
    });
  }
])
.controller('AdminIndexController', ['$scope', '$state', 'adminApi',
  ($scope, $state, adminApi) => {
    $scope.setTitle('首页');
    adminApi.getIndexInfo().then(success => {
      $scope.signupUsers = success.signup;
      $scope.loginUsers = success.login;
    });
    $scope.toUser = id => {
      $state.go('admin.userPage', { userId: id });
    };
  }
])
.controller('AdminPayController', ['$scope', 'adminApi', 'orderDialog',
  ($scope, adminApi, orderDialog) => {
    $scope.setTitle('续费');
    adminApi.getOrder().then(orders => $scope.orders = orders);
    $scope.showOrderInfo = order => {
      orderDialog.show(order);
    };
  }
])
;
