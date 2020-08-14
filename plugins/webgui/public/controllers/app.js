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
      $state.go('app.login');
    }
    $scope.setMainLoading(false);
  }
])
.controller('AppIndexController', ['$scope', '$state', 'userApi', '$http', '$interval', 'autopopDialog',
  ($scope, $state, userApi, $http, $interval, autopopDialog) => {
    $scope.proxy = {
      status: false,
      mode: 'Rule',
    };
    $scope.changeMode = () => {
      window.setProxyMode($scope.proxy.mode);
    };
    $scope.changeStatus = () => {
      window.setProxyStatus($scope.proxy.status);
    };
    $scope.setProxy = server => {
      if(server.disabled) { return; }
      $scope.selectedServerId = server.id;
      window.setProxyServer(server.name);
    };
    $scope.account = {};
    $scope.servers = [];
    $scope.currentFlow = 0;
    $scope.selectedServerId = 0;
    $scope.subscribe = '';
    userApi.getUserAccount().then(success => {
      if(success.account.length) {
        $scope.account = success.account[0];
      } else {

      }
      $scope.servers = success.servers;
      if($scope.account.server) {
        $scope.servers.forEach(server => {
          if(!$scope.account.server.includes(server.id)) {
            server.disabled = true;
          }
        });
      }
      $scope.servers = $scope.servers.filter(f => f.type !== 'WireGuard').sort((a, b) => {
        if(a.disabled) { return 1; }
        if(b.disabled) { return -1; }
        return 0;
      });
      $scope.selectedServerId = $scope.servers[0].id;
      $scope.setProxy($scope.servers[0]);
      return $http.get(`/api/user/account/${$scope.account.id}/subscribe`).then(s => s.data);
    }).then(success => {
      $scope.subscribe = `${window.location.origin}/api/user/account/subscribe/${success.subscribe}?type=clash&ip=0&flow=0`;
      window.saveConfigToFile($scope.subscribe);
      getCurrentFlow();
      $interval(() => {
        getCurrentFlow();
      }, 90 * 1000);
    });
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
  }
])
.controller('AppLoginController', ['$scope', '$state', 'alertDialog', 'homeApi', 'configManager', '$http',
  ($scope, $state, alertDialog, homeApi, configManager, $http) => {
    $scope.user = {};
    $scope.login = () => {
      alertDialog.loading().then(() => {
        return homeApi.userLogin($scope.user.email, $scope.user.password);
      }).then(success => {
        $scope.setId(success.id);
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
