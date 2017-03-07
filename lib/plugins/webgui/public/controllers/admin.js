const app = require('../index').app;

app.controller('AdminController', ['$scope', '$mdMedia', '$mdSidenav', '$state', '$http', '$document', '$interval', '$localStorage',
  ($scope, $mdMedia, $mdSidenav, $state, $http, $document, $interval, $localStorage) => {
    if ($localStorage.home.status !== 'admin') {
      $state.go('home.index');
    } else {
      $scope.setMainLoading(false);
    }
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
      name: '订单',
      icon: 'attach_money',
      click: 'admin.pay',
    }, {
    //   name: '设置',
    //   icon: 'settings',
    //   click: 'admin.unfinished',
    // }, {
      name: 'divider',
    }, {
      name: '退出',
      icon: 'exit_to_app',
      click: function() {
        $http.post('/api/home/logout').then(() => {
          $localStorage.home = {};
          $localStorage.admin = {};
          $scope.sendPushSubscribe();
          $state.go('home.index');
        });
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
    $scope.interval = null;
    $scope.setInterval = interval => {
      $scope.interval = interval;
    };
    $scope.$on('$stateChangeStart', function(event, toUrl, fromUrl) {
      $scope.fabButton = false;
      $scope.title = '';
      $scope.menuButtonIcon = '';
      $scope.menuRightButtonIcon = '';
      $scope.menuSearchButtonIcon = '';
      $scope.menuSearch.text = '';
      $scope.menuSearch.input = false;
      $scope.interval && $interval.cancel($scope.interval);
    });
  }
])
.controller('AdminIndexController', ['$scope', '$state', 'adminApi', '$localStorage', '$interval',
  ($scope, $state, adminApi, $localStorage, $interval) => {
    $scope.setTitle('首页');
    if($localStorage.admin.indexInfo) {
      $scope.signupUsers = $localStorage.admin.indexInfo.data.signup;
      $scope.loginUsers = $localStorage.admin.indexInfo.data.login;
    }
    $scope.toUser = id => {
      $state.go('admin.userPage', { userId: id });
    };
    const updateIndexInfo = () => {
      adminApi.getIndexInfo().then(success => {
        $localStorage.admin.indexInfo = {
          time: Date.now(),
          data: success,
        };
        $scope.signupUsers = success.signup;
        $scope.loginUsers = success.login;
      });
    };
    updateIndexInfo();
    $scope.$on('visibilitychange', (event, status) => {
      if(status === 'visible') {
        if($localStorage.admin.indexInfo && Date.now() - $localStorage.admin.indexInfo.time >= 10 * 1000) {
          updateIndexInfo();
        }
      }
    });
    $scope.setInterval($interval(() => {
      if($localStorage.admin.indexInfo && Date.now() - $localStorage.admin.indexInfo.time >= 90 * 1000) {
        updateIndexInfo();
      }
    }, 15 * 1000));
  }
])
.controller('AdminPayController', ['$scope', 'adminApi', 'orderDialog', '$mdMedia', '$localStorage', 'orderFilterDialog', '$timeout',
  ($scope, adminApi, orderDialog, $mdMedia, $localStorage, orderFilterDialog, $timeout) => {
    $scope.setTitle('订单');
    $scope.setMenuSearchButton('search');
    $scope.showOrderInfo = order => {
      orderDialog.show(order);
    };
    if(!$localStorage.admin.orderFilterSettings) {
      $localStorage.admin.orderFilterSettings = {
        filter: {
          CREATE: true,
          WAIT_BUYER_PAY: true,
          TRADE_SUCCESS: true,
          FINISH: true,
          TRADE_CLOSED: true,
        },
      };
    }
    $scope.orderFilter = $localStorage.admin.orderFilterSettings;
    $scope.currentPage = 1;
    $scope.isOrderLoading = false;
    $scope.isOrderPageFinish = false;
    $scope.orders = [];
    const getPageSize = () => {
      if($mdMedia('xs')) { return 30; }
      if($mdMedia('sm')) { return 30; }
      if($mdMedia('md')) { return 40; }
      if($mdMedia('gt-md')) { return 50; }
    };
    $scope.getOrders = (search) => {
      $scope.isOrderLoading = true;
      adminApi.getOrder({
        page: $scope.currentPage,
        pageSize: getPageSize(),
        search,
        // sort: $scope.userSort.sort,
        filter: Object.keys($scope.orderFilter.filter).filter(f => $scope.orderFilter.filter[f]),
      }).then(success => {
        if(!search && $scope.menuSearch.text) { return; }
        if(search && search !== $scope.menuSearch.text) { return; }
        success.orders.forEach(f => {
          $scope.orders.push(f);
        });
        if(success.maxPage > $scope.currentPage) {
          $scope.currentPage++;
        } else {
          $scope.isOrderPageFinish = true;
        }
        $scope.isOrderLoading = false;
      }).catch(() => {
        $timeout(() => {
          $scope.getOrders(search);
        }, 5000);
      });
    };
    $scope.$on('cancelSearch', () => {
      $scope.currentPage = 1;
      $scope.isOrderPageFinish = false;
      $scope.orders = [];
      $scope.getOrders();
    });
    let timeoutPromise;
    const orderFilter = () => {
      $scope.currentPage = 1;
      $scope.isOrderPageFinish = false;
      $scope.orders = [];
      $scope.getOrders($scope.menuSearch.text);
    };
    $scope.$watch('menuSearch.text', () => {
      if(!$scope.menuSearch.text) { return; }
      timeoutPromise && $timeout.cancel(timeoutPromise);
      timeoutPromise = $timeout(() => {
        orderFilter();
      }, 500);
    });
    $scope.view = (inview) => {
      if(!inview || $scope.isOrderLoading || $scope.isOrderPageFinish) { return; }
      $scope.getOrders();
    };
    $scope.setMenuRightButton('sort_by_alpha');
    $scope.orderFilterDialog = () => {
      orderFilterDialog.show().then(() => {
        $scope.currentPage = 1;
        $scope.isOrderPageFinish = false;
        $scope.orders = [];
        $scope.getOrders();
      });
    };
    $scope.$on('RightButtonClick', () => {
      $scope.orderFilterDialog();
    });
  }
]);
