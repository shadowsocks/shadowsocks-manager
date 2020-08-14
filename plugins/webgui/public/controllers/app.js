const app = angular.module('app');

app
.controller('AppController', [() => {}])
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
.controller('AppIndexController', ['$scope', '$state', 'userApi', '$http', '$interval', '$localStorage',
  ($scope, $state, userApi, $http, $interval, $localStorage) => {
    $scope.proxy = {
      status: false,
      mode: 'Rule',
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
        return oldServers === newServers;
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
        return $http.get(`/api/user/account/${account.id}/subscribe`).then(s => s.data);
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
      });
    };
    refreshAccountData();
    $interval(() => { refreshAccountData(); }, 60 * 1000);

    // userApi.getUserAccount().then(success => {
    //   if(success.account.length) {
    //     $scope.account = success.account[0];
    //   } else {

    //   }
    //   $scope.servers = success.servers;
    //   if($scope.account.server) {
    //     $scope.servers.forEach(server => {
    //       if(!$scope.account.server.includes(server.id)) {
    //         server.disabled = true;
    //       }
    //     });
    //   }
    //   $scope.servers = $scope.servers.filter(f => f.type !== 'WireGuard').sort((a, b) => {
    //     if(a.disabled) { return 1; }
    //     if(b.disabled) { return -1; }
    //     return 0;
    //   });
    //   $scope.selectedServerId = $scope.servers[0].id;
    //   return $http.get(`/api/user/account/${$scope.account.id}/subscribe`).then(s => s.data);
    // }).then(success => {
    //   $scope.subscribe = `${window.location.origin}/api/user/account/subscribe/${success.subscribe}?type=clash&ip=0&flow=0`;
    //   getCurrentFlow();
    //   $interval(() => {
    //     getCurrentFlow();
    //   }, 90 * 1000);
    //   return window.saveConfigToFile($scope.subscribe);
    // }).then(success => {
    //   $scope.setProxy($scope.servers[0]);
    // });
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
    $interval(() => {
      getCurrentFlow();
    }, 90 * 1000);
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
  }
])
;
