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
      $scope.alertDialog = (isLoading, content, button) => {
        $scope.isAlertDialogLoading = isLoading;
        $scope.alertDialogContent = content;
        $scope.alertDialogButton = button;
        if(alertDialogPromise && !alertDialogPromise.$$state.status) {
          return alertDialogPromise;
        }
        const dialog = {
          templateUrl: '/public/views/home/alertDialog.html',
          escapeToClose: false,
          scope: $scope,
          preserveScope: true,
          clickOutsideToClose: false,
        };
        alertDialogPromise = $mdDialog.show(dialog);
        return alertDialogPromise;
      };
      $scope.closeAlertDialog = () => {
        $mdDialog.hide().then(() => {
          alertDialogPromise = null;
        }).catch(() => {
          alertDialogPromise = null;
        });
      };
    }
  ])
  .controller('HomeIndexController', ['$scope',
    ($scope) => {

    }
  ])
  .controller('HomeLoginController', ['$scope', '$http', '$state', 'HomeApi',
    ($scope, $http, $state, HomeApi) => {
      $scope.user = {};
      $scope.login = () => {
        // if (!$scope.user.email || !$scope.user.password) {
        //   return;
        // }
        // $scope.alertDialog(true);
        // $http.post('/api/home/login', {
        //   email: $scope.user.email,
        //   password: $scope.user.password,
        // }).then(success => {
        //   $scope.closeAlertDialog();
        //   if (success.data.type === 'normal') {
        //     $state.go('user.index');
        //   } else if (success.data.type === 'admin') {
        //     $state.go('admin.index');
        //   }
        // }).catch(err => {
        //   if(err.status === 403) {
        //     $scope.alertDialog(false, '用户名或密码错误', '确定');
        //   } else {
        //     $scope.alertDialog(false, '网络异常，请稍后再试', '确定');
        //   }
        // });
        $scope.alertDialog(true);
        HomeApi.userLogin($scope.user.email, $scope.user.password)
        .then(success => {
          $scope.closeAlertDialog();
          if (success === 'normal') {
            $state.go('user.index');
          } else if (success === 'admin') {
            $state.go('admin.index');
          }
        }).catch(err => {
          $scope.alertDialog(false, err, '确定');
        });
      };
      $scope.findPassword = () => {
        $scope.alertDialog(true);
        $http.post('/api/home/password/sendEmail', {
          email: $scope.user.email,
        }).then(success => {
          $scope.alertDialog(false, '重置密码链接已发至您的邮箱，\n请注意查收', '确定');
        }).catch(err => {
          let errData = null;
          if(err.status === 403 && err.data === 'already send') {
            errData = '重置密码链接已经发送，\n请勿重复发送';
          }
          if(err.status === 403 && err.data === 'user not exists') {
            errData = '请输入正确的邮箱地址';
          }
          $scope.alertDialog(false, errData || '重置密码链接发送错误', '确定');
        });
      };
    }
  ])
  .controller('HomeSignupController', ['$scope', '$http', '$state', '$interval', '$timeout',
    ($scope, $http, $state, $interval, $timeout) => {
      $scope.user = {};
      $scope.sendCodeTime = 0;
      $scope.sendCode = () => {
        $scope.alertDialog(true);
        $http.post('/api/home/code', {
          email: $scope.user.email,
        }).then(success => {
          $scope.alertDialog(false, '验证码已发至邮箱', '确定');
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
          $scope.alertDialog(false, '验证码发送错误', '确定');
        });
      };
      $scope.signup = () => {
        $scope.alertDialog(true);
        $http.post('/api/home/signup', {
          email: $scope.user.email,
          code: $scope.user.code,
          password: $scope.user.password,
        }).then(success => {
          return $scope.alertDialog(false, '用户注册成功', '确定');
        }).then(() => {
          $state.go('home.login');
        }).catch(err => {
          $scope.alertDialog(false, '用户注册失败', '确定');
        });
      };
    }
  ])
  .controller('HomeResetPasswordController', ['$scope', '$http', '$state', '$stateParams',
    ($scope, $http, $state, $stateParams) => {
      $scope.user = {};
      const token = $stateParams.token;
      $scope.alertDialog(true);
      $http.get('/api/home/password/reset', {
        params: {
          token
        },
      }).then(success => {
        $scope.closeAlertDialog();
      }).catch(err => {
        $scope.alertDialog(false, '该链接已经失效', '确定').then(() => {
          $state.go('home.index');
        });
      });
      $scope.resetPassword = () => {
        $scope.alertDialog(true);
        $http.post('/api/home/password/reset', {
          token,
          password: $scope.user.password,
        }).then(() => {
          $scope.alertDialog(false, '修改密码成功', '确定').then(() => {
            $state.go('home.login');
          });
        }).catch(() => {
          $scope.alertDialog(false, '修改密码失败', '确定');
        });
      };
    }
  ]);
