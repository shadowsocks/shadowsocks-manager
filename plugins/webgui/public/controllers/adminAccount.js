const app = angular.module('app');

app.controller('AdminAccountController', ['$scope', '$state', '$stateParams', '$http', 'accountSortDialog','$interval', 'adminApi', '$localStorage', 'accountSortTool',
  ($scope, $state, $stateParams, $http, accountSortDialog, $interval, adminApi, $localStorage, accountSortTool) => {
    $scope.setTitle('账号');
    $scope.setMenuRightButton('sort_by_alpha');
    $scope.setMenuSearchButton('search');
    if(!$localStorage.admin.accountFilterSettings) {
      $localStorage.admin.accountFilterSettings = {
        sort: 'port_asc',
        filter: {
          expired: true,
          unexpired: true,
          unlimit: true,
        },
      };
    }
    $scope.accountMethod = $localStorage.admin.accountFilterSettings;
    $scope.accountInfo = {};
    $scope.sortAndFilter = () => {
      accountSortTool($scope.accountInfo, $scope.accountMethod);
    };
    if(!$localStorage.admin.accountInfo) {
      $localStorage.admin.accountInfo = {
        time: Date.now(),
        data: [],
      };
    }
    $scope.accountInfo.originalAccount = $localStorage.admin.accountInfo.data;
    $scope.accountInfo.account = angular.copy($scope.accountInfo.originalAccount);
    $scope.sortAndFilter();
    const getAccountInfo = () => {
      adminApi.getAccount().then(accounts => {
        $localStorage.admin.accountInfo = {
          time: Date.now(),
          data: accounts,
        };
        $scope.accountInfo.originalAccount = accounts;
        $scope.accountInfo.account = angular.copy($scope.accountInfo.originalAccount);
        $scope.sortAndFilter();
      });
    };
    getAccountInfo();
    $scope.$on('visibilitychange', (event, status) => {
      if(status === 'visible') {
        if($localStorage.admin.accountInfo && Date.now() - $localStorage.admin.accountInfo.time >= 20 * 1000) {
          getAccountInfo();
        }
      }
    });
    $scope.setInterval($interval(() => {
      if($localStorage.admin.accountInfo && Date.now() - $localStorage.admin.accountInfo.time >= 90 * 1000) {
        getAccountInfo();
      }
    }, 15 * 1000));
    $scope.setFabButton(() => {
      $state.go('admin.addAccount');
    });
    $scope.toAccount = id => {
      $state.go('admin.accountPage', { accountId: id });
    };
    $scope.sortAndFilterDialog = () => {
      accountSortDialog.show($scope.accountMethod, $scope.accountInfo);
    };
    $scope.$on('RightButtonClick', () => {
      $scope.sortAndFilterDialog();
    });
    const accountFilter = () => {
      accountSortTool($scope.accountInfo, $scope.accountMethod);
      $scope.accountInfo.account = $scope.accountInfo.account.filter(f => {
        return (f.port + (f.user ? f.user : '')).indexOf($scope.menuSearch.text) >= 0;
      });
    };
    $scope.$on('cancelSearch', () => {
      accountSortTool($scope.accountInfo, $scope.accountMethod);
    });
    $scope.$watch('menuSearch.text', () => {
      if(!$scope.menuSearch.input) {
        return;
      }
      if(!$scope.menuSearch.text) {
        accountSortTool($scope.accountInfo, $scope.accountMethod);
        return;
      }
      accountFilter();
    });
    $scope.accountColor = account => {
      if(account.type === 1) {
        return {
          background: 'blue-50', 'border-color': 'blue-300',
        };
      } else if(account.data && account.data.expire <= Date.now()) {
        return {
          background: 'red-50', 'border-color': 'red-300',
        };
      }
      return {};
    };
  }
])
.controller('AdminAccountPageController', ['$scope', '$state', '$stateParams', '$http', '$mdMedia', '$q', 'adminApi', '$timeout', '$interval',
  ($scope, $state, $stateParams, $http, $mdMedia, $q, adminApi, $timeout, $interval) => {
    $scope.setTitle('账号');
    $scope.setMenuButton('arrow_back', 'admin.account');
    $q.all([
      $http.get('/api/admin/account/' + $stateParams.accountId),
      $http.get('/api/admin/server'),
    ]).then(success => {
      $scope.account = success[0].data;
      $scope.servers = success[1].data.map(server => {
        if(server.host.indexOf(':') >= 0) {
          server.host = server.host.split(':')[1];
        }
        return server;
      });
      $scope.getServerPortData($scope.servers[0].id, $scope.account.port);
    });
    let currentServerId;
    $scope.getServerPortData = (serverId, port) => {
      currentServerId = serverId;
      $scope.serverPortFlow = 0;
      $scope.lastConnect = 0;
      adminApi.getServerPortData(serverId, port).then(success => {
        $scope.serverPortFlow = success.serverPortFlow;
        $scope.lastConnect = success.lastConnect;
      });
      $scope.getChartData(serverId);
      $scope.servers.forEach((server, index) => {
        if(server.id === serverId) { return; }
        $timeout(() => {
          adminApi.getServerPortData(server.id, port);
        }, index * 1000);
      });
    };
    $scope.setInterval($interval(() => {
      const serverId = currentServerId;
      adminApi.getServerPortData(serverId, $scope.account.port).then(success => {
        if(serverId !== currentServerId) { return; }
        $scope.lastConnect = success.lastConnect;
        $scope.serverPortFlow = success.flow;
      });
    }, 60 * 1000));
    const base64Encode = str => {
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
      }));
    };
    $scope.createQrCode = (method, password, host, port, serverName) => {
      return 'ss://' + base64Encode(method + ':' + password + '@' + host + ':' + port) + '#' + serverName;
    };
    $scope.editAccount = id => {
      $state.go('admin.editAccount', { accountId: id });
    };

    $scope.getQrCodeSize = () => {
      if($mdMedia('xs')) {
        return 230;
      } else if ($mdMedia('lg')) {
        return 240;
      }
      return 180;
    };

    $scope.flowType = {
      value: 'day',
    };
    const flowTime = {
      hour: Date.now(),
      day: Date.now(),
      week: Date.now(),
    };
    const flowLabel = {
      hour: ['0', '', '', '15', '', '', '30', '', '', '45', '', ''],
      day: ['0', '', '', '', '', '', '6', '', '', '', '', '', '12', '', '', '', '', '', '18', '', '', '', '', '', ],
      week: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    };
    const scaleLabel = (number) => {
      if(number < 1) {
        return number.toFixed(1) +' B';
      } else if (number < 1000) {
        return number.toFixed(0) +' B';
      } else if (number < 1000000) {
        return (number/1000).toFixed(0) +' KB';
      } else if (number < 1000000000) {
        return (number/1000000).toFixed(0) +' MB';
      } else if (number < 1000000000000) {
        return (number/1000000000).toFixed(1) +' GB';
      } else {
        return number;
      }
    };
    const setChart = (lineData, pieData) => {
      $scope.pieChart = {
        data: pieData.map(m => m.flow),
        labels: pieData.map(m => m.name),
        options: {
          responsive: false,
          tooltips: {
            enabled: true,
            mode: 'single',
            callbacks: {
              label: function(tooltipItem, data) {
                const label = data.labels[tooltipItem.index];
                const datasetLabel = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                return label + ': ' + scaleLabel(datasetLabel);
              }
            }
          },
        },
      };
      $scope.lineChart = {
        data: [lineData],
        labels: flowLabel[$scope.flowType.value],
        series: 'day',
        datasetOverride: [{ yAxisID: 'y-axis-1' }],
        options: {
          responsive: false,
          tooltips: {
            callbacks: {
              label: function(tooltipItem) {
                return scaleLabel(tooltipItem.yLabel);
              }
            }
          },
          scales: {
            yAxes: [
              {
                id: 'y-axis-1',
                type: 'linear',
                display: true,
                position: 'left',
                ticks: {
                  callback: scaleLabel,
                },
              }
            ]
          }
        },
      };
    };
    $scope.getChartData = (serverId) => {
      adminApi.getAccountChartData(serverId, $stateParams.accountId, $scope.account.port, $scope.flowType.value, flowTime[$scope.flowType.value])
      .then(success => {
        $scope.sumFlow = success[0].data.reduce((a, b) => {
          return a + b;
        }, 0);
        setChart(success[0].data, success[1].data);
      });
      if($scope.flowType.value === 'hour') {
        $scope.time = moment(flowTime[$scope.flowType.value]).format('YYYY-MM-DD HH:00');
      }
      if($scope.flowType.value === 'day') {
        $scope.time = moment(flowTime[$scope.flowType.value]).format('YYYY-MM-DD');
      }
      if($scope.flowType.value === 'week') {
        $scope.time = moment(flowTime[$scope.flowType.value]).day(0).format('YYYY-MM-DD') + ' / ' + moment(flowTime[$scope.flowType.value]).day(6).format('YYYY-MM-DD');
      }
    };
    $scope.changeFlowTime = (serverId, number) => {
      const time = {
        hour: 3600 * 1000,
        day: 24 * 3600 * 1000,
        week: 7 * 24 * 3600 * 1000,
      };
      flowTime[$scope.flowType.value] += number * time[$scope.flowType.value];
      $scope.getChartData(serverId);
    };
    $scope.resetFlowTime = serverId => {
      flowTime[$scope.flowType.value] = Date.now();
      $scope.getChartData(serverId);
    };
    $scope.getChartSize = () => {
      if($mdMedia('xs')) {
        return {
          line: [ 320, 170 ],
          pie: [ 170, 170 ],
        };
      } else if($mdMedia('sm')) {
        return {
          line: [ 360, 190 ],
          pie: [ 190, 190 ],
        };
      } else if($mdMedia('md')) {
        return {
          line: [ 360, 180 ],
          pie: [ 180, 180 ],
        };
      } else if($mdMedia('gt-md')) {
        return {
          line: [ 540, 240 ],
          pie: [ 240, 240 ],
        };
      }
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
    $scope.toUserPage = userId => {
      if(!userId) { return; }
      $state.go('admin.userPage', { userId });
    };
  }
])
.controller('AdminAddAccountController', ['$scope', '$state', '$stateParams', '$http', '$mdBottomSheet',
  ($scope, $state, $stateParams, $http, $mdBottomSheet) => {
    $scope.setTitle('添加账号');
    $scope.setMenuButton('arrow_back', 'admin.account');
    $scope.typeList = [
      {key: '不限量', value: 1},
      {key: '按周', value: 2},
      {key: '按月', value: 3},
      {key: '按天', value: 4},
      {key: '小时', value: 5},
    ];
    $scope.timeLimit = {
      '2': 7 * 24 * 3600000,
      '3': 30 * 24 * 3600000,
      '4': 24 * 3600000,
      '5': 3600000,
    };
    $scope.account = {
      time: Date.now(),
      limit: 1,
      flow: 100,
      autoRemove: 0,
    };
    $scope.cancel = () => {
      $state.go('admin.account');
    };
    $scope.confirm = () => {
      $http.post('/api/admin/account', {
        type: +$scope.account.type,
        port: +$scope.account.port,
        password: $scope.account.password,
        time: $scope.account.time,
        limit: +$scope.account.limit,
        flow: +$scope.account.flow * 1000 * 1000,
        autoRemove: $scope.account.autoRemove ? 1 : 0,
      }).then(success => {
        $state.go('admin.account');
      });
    };
    $scope.pickTime = () => {
      $mdBottomSheet.show({
        templateUrl: '/public/views/admin/pickTime.html',
        preserveScope: true,
        scope: $scope,
      });
    };
    $scope.setStartTime = (number) => {
      $scope.account.time += number;
    };
    $scope.setLimit = (number) => {
      $scope.account.limit += number;
      if($scope.account.limit < 1) {
        $scope.account.limit = 1;
      }
    };
  }
])
.controller('AdminEditAccountController', ['$scope', '$state', '$stateParams', '$http', '$mdBottomSheet', 'confirmDialog',
  ($scope, $state, $stateParams, $http, $mdBottomSheet, confirmDialog) => {
    $scope.setTitle('编辑账号');
    $scope.setMenuButton('arrow_back', function() {
      $state.go('admin.accountPage', { accountId: $stateParams.accountId });
    });
    $scope.typeList = [
      {key: '不限量', value: 1},
      {key: '按周', value: 2},
      {key: '按月', value: 3},
      {key: '按天', value: 4},
      {key: '小时', value: 5},
    ];
    $scope.timeLimit = {
      '2': 7 * 24 * 3600000,
      '3': 30 * 24 * 3600000,
      '4': 24 * 3600000,
      '5': 3600000,
    };
    $scope.account = {
      time: Date.now(),
      limit: 1,
      flow: 100,
      autoRemove: 0,
    };
    const accountId = $stateParams.accountId;
    $http.get('/api/admin/account/' + accountId).then(success => {
      $scope.account.type = success.data.type;
      $scope.account.port = success.data.port;
      $scope.account.password = success.data.password;
      $scope.account.autoRemove = success.data.autoRemove;
      if(success.data.type >= 2 && success.data.type <= 5) {
        $scope.account.time = success.data.data.create;
        $scope.account.limit = success.data.data.limit;
        $scope.account.flow = success.data.data.flow / 1000000;
      }
    });
    $scope.cancel = () => {
      $state.go('admin.accountPage', { accountId: $stateParams.accountId });
    };
    $scope.confirm = () => {
      $http.put('/api/admin/account/' + accountId + '/data', {
        type: +$scope.account.type,
        port: +$scope.account.port,
        password: $scope.account.password,
        time: $scope.account.time,
        limit: +$scope.account.limit,
        flow: +$scope.account.flow * 1000 * 1000,
        autoRemove: $scope.account.autoRemove ? 1 : 0,
      }).then(success => {
        $state.go('admin.accountPage', { accountId: $stateParams.accountId });
      });
    };
    $scope.pickTime = () => {
      $mdBottomSheet.show({
        templateUrl: '/public/views/admin/pickTime.html',
        preserveScope: true,
        scope: $scope,
      });
    };
    $scope.setStartTime = (number) => {
      $scope.account.time += number;
    };
    $scope.setLimit = (number) => {
      $scope.account.limit += number;
      if($scope.account.limit < 1) {
        $scope.account.limit = 1;
      }
    };
    $scope.deleteAccount = () => {
      confirmDialog.show({
        text: '真的要删除账号吗？',
        cancel: '取消',
        confirm: '删除',
        error: '删除账号失败',
        fn: function () { return $http.delete('/api/admin/account/' + accountId); },
      }).then(() => {
        $state.go('admin.account');
      });
    };
  }
]);
