const app = angular.module('app');

app
.controller('AppController', ['$scope', '$state', '$http', '$localStorage', 'configManager', ($scope, $state, $http, $localStorage, configManager) => {
  const handleLogout = () => {
    $http.post('/api/home/logout').then(() => {
      window.setProxyStatus();
      $localStorage.app = {};
      configManager.deleteConfig();
      $state.go('app.loading');
    });
  };
  window.addEventListener('ssmgr_logout', handleLogout);
  $scope.hide = () => {
    window.hideApp();
  };
}])
.controller('AppLoadingController', ['$scope', '$mdMedia', '$mdSidenav', '$state', '$http', '$interval', '$localStorage', 'userApi', 'configManager', '$window',
  ($scope, $mdMedia, $mdSidenav, $state, $http, $interval, $localStorage, userApi, configManager, $window) => {
    const config = configManager.getConfig();
    if(config.status === 'normal') {
      $state.go('app.index');
    } else {
      $localStorage.admin = {};
      $localStorage.user = {};
      $localStorage.app = {};
      $state.go('app.login');
    }
    $scope.setMainLoading(false);
  }
])
.controller('AppIndexController', ['$scope', '$q', 'userApi', '$http', '$interval', '$localStorage',
  ($scope, $q, userApi, $http, $interval, $localStorage) => {
    $scope.isInit = false;
    $scope.proxy = {
      status: false,
      mode: 'Rule',
    };
    $scope.orders = [];
    $scope.pay = {
      status: 'choose',
      qrcode: '',
    };
    $scope.changeMode = () => {
      window.setProxyMode($scope.proxy.mode);
      $localStorage.app.mode = $scope.proxy.mode;
    };
    $scope.changeStatus = () => {
      window.setProxyStatus($scope.proxy.status);
      $localStorage.app.status = $scope.proxy.status;
    };
    $scope.setProxy = server => {
      if(server.disabled) { return; }
      $scope.selectedServerId = server.id;
      $localStorage.app.selectedServerId = server.id;
      window.setProxyServer(server.name);
    };
    $scope.account = {};
    $scope.servers = [];
    $scope.currentFlow = 0;
    $scope.selectedServerId = 0;
    $scope.subscribe = '';

    const refreshAccountData = () => {
      let account = {};
      let servers = [];
      const compareAccountInfo = () => {
        const oldAccount = JSON.stringify(Object.assign({}, {
          id: $scope.account.id,
          port: $scope.account.port,
          password: $scope.account.password,
          expire: $scope.account.data ? $scope.account.data.expire : null,
        }));
        const newAccount = JSON.stringify(Object.assign({}, {
          id: account.id,
          port: account.port,
          password: account.password,
          expire: account.data ? account.data.expire : null,
        }));
        const oldServers = JSON.stringify($scope.servers.map(server => ({
          id: server.id,
          name: server.name,
          disabled: server.disabled,
        })));
        const newServers = JSON.stringify(servers.map(server => ({
          id: server.id,
          name: server.name,
          disabled: server.disabled,
        })));
        return oldServers === newServers && newAccount === oldAccount;
      };
      return userApi.getUserAccount().then(success => {
        account = success.account[0] || {};
        servers = success.servers;
        if(account && account.server) {
          servers.forEach(server => {
            if(!account.server.includes(server.id)) {
              server.disabled = true;
            }
          });
        }
        servers = servers.filter(f => f.type !== 'WireGuard').sort((a, b) => {
          if(a.disabled) { return 1; }
          if(b.disabled) { return -1; }
          return 0;
        });
        $localStorage.app.account = account;
        $localStorage.app.servers = servers;
        if(!account.id) {
          $scope.account = account;
          $scope.servers = servers;
          return $q.reject('no account');
        }
        $scope.pay.status = 'choose';
        return $http.get(`/api/user/account/${account.id}/subscribe?from=app`).then(s => s.data);
      }).then(success => {
        $scope.subscribe = `${window.location.origin}/api/user/account/subscribe/${success.subscribe}?type=clash&ip=0&flow=0`;
        return compareAccountInfo();
      }).then(result => {
        if(!result) {
          $scope.account = account;
          $scope.servers = servers;
          return window.saveConfigToFile($scope.subscribe).then(s => result);
        }
        return result;
      }).then(success=> {
        let selectedServer;
        if($localStorage.app.selectedServerId) {
          selectedServer = $scope.servers.find(server => server.id === $localStorage.app.selectedServerId);
        } else {
          selectedServer = $scope.servers[0];
        }
        if(selectedServer.disabled) {
          selectedServer = $scope.servers[0];
        }
        if($scope.selectedServerId !== selectedServer.id || !success) {
          $scope.selectedServerId = selectedServer.id;
          $scope.setProxy(selectedServer);
        }
        if(!success) {
          if($localStorage.app.hasOwnProperty('mode') && $localStorage.app.mode !== $scope.proxy.mode) {
            $scope.proxy.mode = $localStorage.app.mode;
            $scope.changeMode();
          }
          if($localStorage.app.hasOwnProperty('status') && $localStorage.app.status !== $scope.proxy.status) {
            $scope.proxy.status = $localStorage.app.status;
            $scope.changeStatus();
          }
        }
        $localStorage.app.selectedServerId = selectedServer.id;
        getCurrentFlow();
        startGetCurrentFlow();
        $scope.isInit = true;
      }, (err) => {
        $scope.isInit = true;
        if(err === 'no account') {
          $scope.proxy.status = false;
          $scope.changeStatus();
          $interval.cancel(getCurrentFlowInterval);
          getCurrentFlowInterval = null;
        }
      });
    };
    refreshAccountData();
    $interval(() => { refreshAccountData(); }, 60 * 1000);

    $scope.serverStyle = server => {
      if(server.id === $scope.selectedServerId) {
        return {
          background: 'rgba(0, 0, 0, 0.05)',
          border: '1px solid #E91E63',
          height: '44px',
          'box-sizing': 'border-box',
          cursor: 'pointer',
        };
      }
      if(server.disabled) {
        return {
          background: 'rgba(230, 230, 230, 0.35)',
          height: '44px',
          cursor: 'not-allowed',
          color: '#aaa',
        };
      }
      return {
        height: '44px',
        cursor: 'pointer',
      };
    };
    const getCurrentFlow = () => {
      userApi.getServerPortData($scope.account, $scope.selectedServerId).then(success => {
        $scope.currentFlow = success.flow;
      });
    };

    let getCurrentFlowInterval;
    const startGetCurrentFlow = () => {
      if(getCurrentFlowInterval) {
        $interval.cancel(getCurrentFlowInterval);
      }
      getCurrentFlowInterval = $interval(() => {
        getCurrentFlow();
      }, 90 * 1000);
    };

    const getPriceList = () => {
      $http.get('/api/user/order/price').then(success => {
        $scope.orders = success.data.sort((a, b) => a.alipay - b.alipay);
      });
    };
    getPriceList();

    $scope.getQrcode = (orderId) => {
      $http.post('/api/user/order/qrcode', {
        orderId,
      }).then(success => {
        $scope.pay.qrcode = success.data.qrCode;
        $scope.pay.status = 'pay';
      });
    };
  }
])
.controller('AppLoginController', ['$scope', '$state', 'alertDialog', 'homeApi', 'configManager', '$http', '$localStorage',
  ($scope, $state, alertDialog, homeApi, configManager, $http, $localStorage) => {
    $scope.user = {};
    $scope.login = () => {
      alertDialog.loading().then(() => {
        return homeApi.userLogin($scope.user.email, $scope.user.password);
      }).then(success => {
        $scope.setId(success.id);
        $localStorage.app = {};
        return alertDialog.close().then(() => {
          return success;
        });
      }).then(success => {
        configManager.deleteConfig();
        if (success.type === 'normal') {
          $state.go('app.index');
        } else if (success.type === 'admin') {
          $http.post('/api/home/logout').then(() => {
            $localStorage.home = {};
            $localStorage.admin = {};
            configManager.deleteConfig();
          });
        }
      }).catch(err => {
        alertDialog.show(err, '确定');
      });
    };
    $scope.enterKey = key => {
      if(key.keyCode === 13) {
        $scope.login();
      }
    };
    $scope.findPassword = () => {
      alertDialog.loading().then(() => {
        return homeApi.findPassword($scope.user.email);
      })
      .then(success => {
        alertDialog.show(success, '确定');
      }).catch(err => {
        alertDialog.show(err, '确定');
      });
    };
    $scope.toSignupPage = () => {
      window.toSignupPage();
    };
  }
])
;
