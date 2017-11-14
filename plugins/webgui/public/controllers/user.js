const app = angular.module('app');

app
.controller('UserController', ['$scope', '$mdMedia', '$mdSidenav', '$state', '$http', '$interval', '$localStorage', 'userApi',
  ($scope, $mdMedia, $mdSidenav, $state, $http, $interval, $localStorage, userApi) => {
    if ($localStorage.home.status !== 'normal') {
      $state.go('home.index');
    } else {
      $scope.setMainLoading(false);
    }
    $scope.innerSideNav = true;
    $scope.sideNavWidth = () => {
      if($scope.innerSideNav) {
        return {
          width: '200px',
        };
      } else {
        return {
          width: '60px',
        };
      }
    };
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
      name: '账号',
      icon: 'account_circle',
      click: 'user.account'
    }, {
      name: '设置',
      icon: 'settings',
      click: 'user.changePassword'
    }, {
      name: 'divider',
    }, {
      name: '退出',
      icon: 'exit_to_app',
      click: function() {
        $http.post('/api/home/logout').then(() => {
          $localStorage.home = {};
          $localStorage.user = {};
          $state.go('home.index');
        });
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
    $scope.interval = null;
    $scope.setInterval = interval => {
      $scope.interval = interval;
    };
    $scope.$on('$stateChangeStart', function(event, toUrl, fromUrl) {
      $scope.title = '';
      $scope.interval && $interval.cancel($scope.interval);
    });

    if(!$localStorage.user.serverInfo && !$localStorage.user.accountInfo) {
      userApi.getUserAccount().then(success => {
        $localStorage.user.serverInfo = {
          data: success.servers,
          time: Date.now(),
        };
        $localStorage.user.accountInfo = {
          data: success.account,
          time: Date.now(),
        };
      });
    };
  }
])
.controller('UserIndexController', ['$scope', '$state', 'userApi', 'markdownDialog',
  ($scope, $state, userApi, markdownDialog) => {
    $scope.setTitle('首页');
    // $scope.notices = [];
    userApi.getNotice().then(success => {
      $scope.notices = success;
    });
    $scope.toMyAccount = () => {
      $state.go('user.account');
    };
    $scope.showNotice = notice => {
      markdownDialog.show(notice.title, notice.content);
    };
  }
])
.controller('UserAccountController', ['$scope', '$http', '$mdMedia', 'userApi', 'alertDialog', 'payDialog', 'qrcodeDialog', '$interval', '$localStorage', 'changePasswordDialog',
  ($scope, $http, $mdMedia, userApi, alertDialog, payDialog, qrcodeDialog, $interval, $localStorage, changePasswordDialog) => {
    $scope.setTitle('账号');
    $scope.flexGtSm = 100;
    if(!$localStorage.user.serverInfo) {
      $localStorage.user.serverInfo = {
        time: Date.now(),
        data: [],
      };
    }
    $scope.servers = $localStorage.user.serverInfo.data;
    if(!$localStorage.user.accountInfo) {
      $localStorage.user.accountInfo = {
        time: Date.now(),
        data: [],
      };
    }
    $scope.account = $localStorage.user.accountInfo.data;
    if($scope.account.length >= 2) {
      $scope.flexGtSm = 50;
    }

    $http.get('/api/user/multiServerFlow').then(success => {
      $scope.isMultiServerFlow = success.data.status;
    });
    
    const setAccountServerList = (account, server) => {
      account.forEach(a => {
        a.serverList = $scope.servers.filter(f => {
          return !a.server || a.server.indexOf(f.id) >= 0;
        });
      });
    };
    setAccountServerList($scope.account, $scope.servers);

    const getUserAccountInfo = () => {
      userApi.getUserAccount().then(success => {
        $scope.servers = success.servers;
        if(success.account.map(m => m.id).join('') === $scope.account.map(m => m.id).join('')) {
          success.account.forEach((a, index) => {
            $scope.account[index].data = a.data;
            $scope.account[index].password = a.password;
            $scope.account[index].port = a.port;
            $scope.account[index].type = a.type;
          });
        } else {
          $scope.account = success.account;
        }
        setAccountServerList($scope.account, $scope.servers);
        $localStorage.user.serverInfo.data = success.servers;
        $localStorage.user.serverInfo.time = Date.now();
        $localStorage.user.accountInfo.data = success.account;
        $localStorage.user.accountInfo.time = Date.now();
        if($scope.account.length >= 2) {
          $scope.flexGtSm = 50;
        }
      });
    };
    getUserAccountInfo();

    const base64Encode = str => {
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
      }));
    };
    $scope.createQrCode = (method, password, host, port, serverName) => {
      return 'ss://' + base64Encode(method + ':' + password + '@' + host + ':' + port);
    };

    $scope.getServerPortData = (account, serverId) => {
      account.currentServerId = serverId;
      const scale = $scope.servers.filter(f => f.id === serverId)[0].scale;
      if(!account.isFlowOutOfLimit) { account.isFlowOutOfLimit = {}; }
      userApi.getServerPortData(account, serverId).then(success => {
        account.lastConnect = success.lastConnect;
        account.serverPortFlow = success.flow;
        let maxFlow = 0;
        if(account.data) {
          maxFlow = account.data.flow * ($scope.isMultiServerFlow ? 1 : scale);
        }
        account.isFlowOutOfLimit[serverId] = maxFlow ? ( account.serverPortFlow >= maxFlow ) : false;
      });
    };

    $scope.$on('visibilitychange', (event, status) => {
      if(status === 'visible') {
        if($localStorage.user.accountInfo && Date.now() - $localStorage.user.accountInfo.time >= 10 * 1000) {
          $scope.account.forEach(a => {
            $scope.getServerPortData(a, a.currentServerId);
          });
        }
      }
    });
    $scope.setInterval($interval(() => {
      if($scope.account) {
        userApi.updateAccount($scope.account)
        .then(() => {
          setAccountServerList($scope.account, $scope.servers);
        });
      }
      $scope.account.forEach(a => {
        const currentServerId = a.currentServerId;
        userApi.getServerPortData(a, a.currentServerId, a.port).then(success => {
          if(currentServerId !== a.currentServerId) { return; }
          a.lastConnect = success.lastConnect;
          a.serverPortFlow = success.flow;
        });
      });
    }, 60 * 1000));

    $scope.getQrCodeSize = () => {
      if($mdMedia('xs')) {
        return 230;
      }
      return 180;
    };
    $scope.showChangePasswordDialog = (accountId, password) => {
      changePasswordDialog.show(accountId, password).then(() => {
        getUserAccountInfo();
      });
    };
    $scope.createOrder = (accountId) => {
      payDialog.chooseOrderType(accountId);
    };
    $scope.fontColor = (time) => {
      if(time >= Date.now()) {
        return {
          color: '#333',
        };
      }
      return {
        color: '#a33',
      };
    };
    $scope.isAccountOutOfDate = account => {
      if(account.type >=2 && account.type <= 5) {
        return Date.now() >= account.data.expire;
      } else {
        return false;
      }
    };
    $scope.showQrcodeDialog = (method, password, host, port, serverName) => {
      const ssAddress = $scope.createQrCode(method, password, host, port, serverName);
      qrcodeDialog.show(serverName, ssAddress);
    };
    $scope.cycleStyle = account => {
      let percent = 0;
      if(account.type !== 1) {
        percent = ((Date.now() - account.data.from) / (account.data.to - account.data.from) * 100).toFixed(0);
      }
      if(percent > 100) {
        percent = 100;
      }
      return {
        background: `linear-gradient(90deg, rgba(0,0,0,0.12) ${ percent }%, rgba(0,0,0,0) 0%)`
      };
    };
  }
])
.controller('UserChangePasswordController', ['$scope', '$state', 'userApi', 'alertDialog', '$http', '$localStorage',
  ($scope, $state, userApi, alertDialog, $http, $localStorage) => {
    $scope.setTitle('设置');
    $scope.data = {
      password: '',
      newPassword: '',
      newPasswordAgain: '',
    };
    $scope.confirm = () => {
      alertDialog.loading();
      userApi.changePassword($scope.data.password, $scope.data.newPassword).then(success => {
        alertDialog.show('修改密码成功，请重新登录', '确定')
        .then(() => {
          return $http.post('/api/home/logout');
        }).then(() => {
          $localStorage.home = {};
          $localStorage.user = {};
          $state.go('home.index');
        });
      }).catch(err => {
        alertDialog.show('修改密码失败', '确定');
      });
    };
  }
]);
