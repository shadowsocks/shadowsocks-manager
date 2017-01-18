const app = require('../index').app;

app.controller('HomeController', ['$scope', '$mdMedia', '$mdSidenav', '$state', '$http', '$mdDialog',
    ($scope, $mdMedia, $mdSidenav, $state, $http, $mdDialog) => {
      $http.get('/api/home/login').then(success => {
        if (success.data.status === 'normal') {
          $state.go('user.index');
        } else if (success.data.status === 'admin') {
          $state.go('admin.index');
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
        click: 'home.index'
      }, {
        name: '登录',
        icon: 'cloud',
        click: 'home.login'
      }, {
        name: '注册',
        icon: 'face',
        click: 'home.signup'
      }];
      $scope.menuClick = (index) => {
        $mdSidenav('left').close();
        $state.go($scope.menus[index].click);
      };

      $scope.isAlertDialogLoading = false;
      $scope.alertDialogContent = '';
      $scope.alertDialogButton = '';
      let alertDialogPromise = null;
      const alertDialog = $mdDialog.prompt({
        templateUrl: '/public/views/home/alertDialog.html',
        escapeToClose: false,
        scope: $scope,
        preserveScope: true,
        clickOutsideToClose: false,
        // controller: function($scope) {
        //   console.log($scope);
        // }
      });
      $scope.alertDialog = (isLoading, content, button) => {
        $scope.isAlertDialogLoading = isLoading;
        $scope.alertDialogContent = content;
        $scope.alertDialogButton = button;
        if(alertDialogPromise && !alertDialogPromise.$$state.status) {
          return;
        }
        alertDialogPromise = $mdDialog.show(alertDialog);
      };
      $scope.closeAlertDialog = () => {
        $mdDialog.hide(alertDialogPromise);
      };
    }
  ])
  .controller('HomeIndexController', ['$scope',
    ($scope) => {

    }
  ])
  .controller('HomeLoginController', ['$scope', '$http', '$state',
    ($scope, $http, $state) => {
      $scope.user = {};
      $scope.login = () => {
        if (!$scope.user.email || !$scope.user.password) {
          return;
        }
        $scope.alertDialog(true);
        $http.post('/api/home/login', {
          email: $scope.user.email,
          password: $scope.user.password,
        }).then(success => {
          if (success.data.type === 'normal') {
            $state.go('user.index');
          } else if (success.data.type === 'admin') {
            $state.go('admin.index');
          }
        }).catch(err => {
          if(err.status === 403) {
            $scope.alertDialog(false, '用户名或密码错误', '确定');
          } else {
            $scope.alertDialog(false, '网络异常', '确定');
          }
        });
      };
      $scope.findPassword = () => {
        $http.post('/api/home/password/sendEmail', {
          email: $scope.user.email,
        }).then(success => {
          console.log(success.data);
        }).catch(console.log);
      };
    }
  ])
  .controller('HomeSignupController', ['$scope', '$http', '$state', '$interval',
    ($scope, $http, $state, $interval) => {
      $scope.user = {};
      $scope.sendCodeTime = 0;
      $scope.sendCode = () => {
        $http.post('/api/home/code', {
          email: $scope.user.email,
        }).then(success => {
          $scope.sendCodeTime = 120;
          const interval = $interval(() => {
            if ($scope.sendCodeTime > 0) {
              $scope.sendCodeTime--;
            } else {
              $interval.cancel(interval);
              $scope.sendCodeTime = 0;
            }
          }, 1000);
        }).catch(err => {
          console.log(err);
        });
      };
      $scope.signup = () => {
        $http.post('/api/home/signup', {
          email: $scope.user.email,
          code: $scope.user.code,
          password: $scope.user.password,
        }).then(success => {
          $state.go('home.login');
        }).catch(console.log);
      };
    }
  ])
  .controller('HomeResetPasswordController', ['$scope', '$http', '$state', '$stateParams',
    ($scope, $http, $state, $stateParams) => {
      $scope.user = {};
      const token = $stateParams.token;
      $http.get('/api/home/password/reset', {
        params: {
          token
        },
      }).then(console.log).catch(err => {
        $state.go('home.index');
      });
      $scope.resetPassword = () => {
        $http.post('/api/home/password/reset', {
          token,
          password: $scope.user.password,
        }).then(console.log).catch(console.log);
      };
    }
  ]);
