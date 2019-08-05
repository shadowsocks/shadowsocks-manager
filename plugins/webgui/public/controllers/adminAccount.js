const app = angular.module('app');

app.controller('AdminAccountController', ['$scope', '$state', '$mdMedia', '$http', 'accountSortDialog','$timeout', 'adminApi', '$localStorage',
  ($scope, $state, $mdMedia, $http, accountSortDialog, $timeout, adminApi, $localStorage) => {
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
          mac: true,
          orderId: 0,
        },
      };
    }
    $scope.accountFilter = $localStorage.admin.accountFilterSettings;
    $scope.currentPage = 1;
    $scope.isAccountLoading = false;
    $scope.isAccountPageFinish = false;
    $scope.account = [];
    const getPageSize = () => {
      if($mdMedia('xs')) { return 30; }
      if($mdMedia('sm')) { return 30; }
      if($mdMedia('md')) { return 60; }
      if($mdMedia('gt-md')) { return 80; }
    };
    $scope.getAccount = (search) => {
      $scope.isAccountLoading = true;
      $http.post('/api/admin/accountWithPage', {
        page: $scope.currentPage,
        pageSize: getPageSize(),
        search,
        sort: $scope.accountFilter.sort,
        filter: $scope.accountFilter.filter,
      }).then(success => {
        // $scope.total = success.data.total;
        $scope.setFabNumber(success.data.total);
        if(!search && $scope.menuSearch.text) { return; }
        if(search && search !== $scope.menuSearch.text) { return; }
        success.data.account.forEach(f => {
          $scope.account.push(f);
        });
        if(success.data.maxPage > $scope.currentPage) {
          $scope.currentPage++;
        } else {
          $scope.isAccountPageFinish = true;
        }
        $scope.isAccountLoading = false;
      }).catch(() => {
        if($state.current.name !== 'admin.account') { return; }
        $timeout(() => {
          $scope.getAccount(search);
        }, 5000);
      });
    };
    $scope.view = (inview) => {
      if(!inview || $scope.isAccountLoading || $scope.isAccountPageFinish) { return; }
      $scope.getAccount();
    };
    const accountFilter = () => {
      $scope.account = [];
      $scope.currentPage = 1;
      $scope.isAccountPageFinish = false;
      $scope.getAccount($scope.menuSearch.text);
    };
    $scope.$on('cancelSearch', () => {
      accountFilter();
    });
    let timeoutPromise;
    $scope.$watch('menuSearch.text', () => {
      if(!$scope.menuSearch.text) { return; }
      timeoutPromise && $timeout.cancel(timeoutPromise);
      timeoutPromise = $timeout(() => {
        accountFilter();
      }, 500);
    });
    $scope.setFabButton($scope.id === 1 ? () => {
      $state.go('admin.addAccount');
    } : null);
    $scope.addAccount = () => {
      $state.go('admin.addAccount');
    };
    $scope.toAccount = account => {
      if(account.mac) {
        $state.go('admin.userPage', { userId: account.userId });
      } else {
        $state.go('admin.accountPage', { accountId: account.id });
      }
    };
    $scope.sortAndFilterDialog = () => {
      return accountSortDialog.show();
    };
    $scope.$on('RightButtonClick', () => {
      $scope.sortAndFilterDialog().then(() => {
        $scope.account = [];
        $scope.currentPage = 1;
        $scope.isAccountPageFinish = false;
        $scope.getAccount();
      });
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
      } else if(account.autoRemove) {
        return {
          background: 'lime-50', 'border-color': 'lime-300',
        };
      }
      return {};
    };
  }
])
.controller('AdminAccountPageController', ['$scope', '$state', '$stateParams', '$http', '$mdMedia', '$q', 'adminApi', '$timeout', '$interval', 'qrcodeDialog', 'ipDialog', '$mdBottomSheet', 'wireGuardConfigDialog',
  ($scope, $state, $stateParams, $http, $mdMedia, $q, adminApi, $timeout, $interval, qrcodeDialog, ipDialog, $mdBottomSheet, wireGuardConfigDialog) => {
    $scope.setTitle('账号');
    $scope.setMenuButton('arrow_back', 'admin.account');
    $scope.accountId = +$stateParams.accountId;
    $scope.account = { port: '...' };
    $q.all([
      $http.get(`/api/admin/account/${ $scope.accountId }`),
      $http.get('/api/admin/server'),
      $http.get('/api/admin/setting/account'),
    ]).then(success => {
      $scope.account = success[0].data;
      $scope.servers = success[1].data.map(server => {
        if(server.host.indexOf(':') >= 0) {
          const hosts = server.host.split(':');
          const number = Math.ceil(Math.random() * (hosts.length - 1));
          server.host = hosts[number];
        }
        return server;
      });
      if($scope.account.server) {
        $scope.servers.sort((a, b) => {
          if($scope.account.server.indexOf(a.id) >= 0 && $scope.account.server.indexOf(b.id) < 0) {
            return -1;
          } else {
            return 0;
          }
        });
      }
      $scope.getServerPortData($scope.servers[0], $scope.accountId);
      $scope.isMultiServerFlow = !!$scope.account.multiServerFlow;
    }).catch(() => {
      $state.go('admin.account');
    });
    let currentServerId;
    $scope.getServerPortData = (server, accountId) => {
      const serverId = server.id;
      currentServerId = serverId;
      $scope.serverPortFlow = 0;
      $scope.lastConnect = 0;
      adminApi.getServerPortData(serverId, accountId).then(success => {
        $scope.serverPortFlow = success.serverPortFlow;
        $scope.lastConnect = success.lastConnect;
        let maxFlow = 0;
        if($scope.account.data) {
          server.isFlowOutOfLimit = (($scope.account.data.flow + $scope.account.data.flowPack) <= $scope.serverPortFlow);
        }
      });
      $scope.getChartData(serverId);
      $scope.servers.forEach((server, index) => {
        if(server.id === serverId) { return; }
        $timeout(() => {
          adminApi.getServerPortData(serverId, accountId);
        }, index * 1000);
      });

      $scope.server = $scope.servers.filter(f => {
        return f.id === serverId;
      })[0];
      
    };
    $scope.setInterval($interval(() => {
      const serverId = currentServerId;
      adminApi.getServerPortData(serverId, $scope.accountId).then(success => {
        if(serverId !== currentServerId) { return; }
        $scope.lastConnect = success.lastConnect;
        $scope.serverPortFlow = success.serverPortFlow;
      });
    }, 60 * 1000));
    const base64Encode = str => {
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
      }));
    };
    $scope.createQrCode = (server, account) => {
      if(server.type === 'WireGuard') {
        const a = account.port % 254;
        const b = (account.port - a) / 254;
        return [
          '[Interface]',
          `Address = ${ server.net.split('.')[0] }.${ server.net.split('.')[1] }.${ b }.${ a + 1 }/32`,
          `PrivateKey = ${ account.privateKey }`,
          'DNS = 8.8.8.8',
          '[Peer]',
          `PublicKey = ${ server.key }`,
          `Endpoint = ${ server.host }:${ server.wgPort }`,
          `AllowedIPs = 0.0.0.0/0`,
        ].join('\n');
      } else {
        return 'ss://' + base64Encode(server.method + ':' + account.password + '@' + server.host + ':' + (account.port + server.shift));
      }
    };
    $scope.showQrcodeDialog = (server, account) => {
      const ssAddress = $scope.createQrCode(server, account);
      qrcodeDialog.show(server.name, ssAddress);
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
                return [label, scaleLabel(datasetLabel)];
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
    $scope.getChartData = serverId => {
      adminApi.getAccountChartData(serverId, $scope.accountId, $scope.flowType.value, flowTime[$scope.flowType.value])
      .then(success => {
        $scope.sumFlow = success[0].data.reduce((a, b) => {
          return a + b;
        }, 0);
        $scope.sumFlowForAllServer = success[1].data.reduce((a, b) => {
          return { flow: a.flow + b.flow };
        }, { flow: 0 });
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
          pie: [ 180, 170 ],
        };
      } else if($mdMedia('sm')) {
        return {
          line: [ 360, 190 ],
          pie: [ 205, 190 ],
        };
      } else if($mdMedia('md')) {
        return {
          line: [ 360, 180 ],
          pie: [ 360, 180 ],
        };
      } else if($mdMedia('gt-md')) {
        return {
          line: [ 540, 240 ],
          pie: [ 450, 240 ],
        };
      }
    };
    $scope.fontColor = account => {
      if(account.data.expire >= Date.now()) {
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
    $scope.clientIp = (serverId, accountId) => {
      ipDialog.show(serverId, accountId);
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
    $scope.setFabButton($scope.id === 1 ? () => {
      $scope.editAccount($scope.account.id);
    } : null, 'mode_edit');
    $scope.setExpireTime = number => {
      $scope.expireTimeShift += number;
    };
    $scope.expireTimeSheet = time => {
      if($scope.id !== 1) { return; }
      if(!time) { return; }
      $scope.expireTimeShift = 0;
      $mdBottomSheet.show({
        templateUrl: '/public/views/admin/setExpireTime.html',
        preserveScope: true,
        scope: $scope,
      }).catch(() => {
        $http.put(`/api/admin/account/${ $scope.accountId }/time`, {
          time: $scope.expireTimeShift,
          check: true,
        }).then(success => {
          $http.get(`/api/admin/account/${ $scope.accountId }`).then(success => {
            $scope.account = success.data;
          });
        });
      });
    };
    $scope.clipboardSuccess = event => {
      $scope.toast('二维码链接已复制到剪贴板');
    };
    $scope.isWG = server => server.type === 'WireGuard';
    $scope.showWireGuard = (server, account) => {
      wireGuardConfigDialog.show(server, account);
    };
  }
])
.controller('AdminAddAccountController', ['$scope', '$state', '$http', '$mdBottomSheet', 'alertDialog', '$filter', 'setAccountServerDialog',
  ($scope, $state, $http, $mdBottomSheet, alertDialog, $filter, setAccountServerDialog) => {
    $scope.setTitle('添加账号');
    $scope.setMenuButton('arrow_back', 'admin.account');
    $http.get('/api/admin/order').then(success => {
      $scope.orders = success.data.filter(f => !f.baseId);
      $scope.account.orderId = $scope.orders[0].id;
    });
    $http.get('/api/admin/account/newPort').then(success => {
      $scope.account.port = success.data.port;
      $scope.account.password = Math.random().toString().substr(2, 10);
    });
    $scope.typeList = [
      {key: '不限量', value: 1},
      {key: '月', value: 3},
      {key: '周', value: 2},
      {key: '天', value: 4},
      {key: '小时', value: 5},
    ];
    $scope.timeLimit = {
      '2': 7 * 24 * 3600000,
      '3': 30 * 24 * 3600000,
      '4': 24 * 3600000,
      '5': 3600000,
    };
    $scope.account = {
      type: 1,
      fromOrder: 0,
      time: Date.now(),
      limit: 1,
      flow: 100000000,
      autoRemove: 0,
      autoRemoveDelay: 0,
      autoRemoveDelayStr: '0',
      multiServerFlow: 0,
      accountServer: false,
      accountServerObj: {},
    };
    $scope.account.flowStr = $filter('flowNum2Str')($scope.account.flow);
    const selectOrder = () => {
      if(!$scope.account.fromOrder) { return; }
      const orderInfo = $scope.orders.filter(f => +f.id === +$scope.account.orderId)[0];
      $scope.account.type = orderInfo.type;
      $scope.account.flow = orderInfo.flow;
      $scope.account.limit = orderInfo.cycle;
      $scope.account.autoRemove = orderInfo.autoRemove;
      $scope.account.autoRemoveDelay = orderInfo.autoRemoveDelay;
      $scope.account.multiServerFlow = orderInfo.multiServerFlow;
      $scope.account.accountServer = !!orderInfo.server;
      $scope.account.flowStr = $filter('flowNum2Str')($scope.account.flow);
      $scope.account.autoRemoveDelayStr = $filter('timeNum2Str')(orderInfo.autoRemoveDelay);
      if(orderInfo.server) {
        $scope.servers.forEach(server => {
          if(JSON.parse(orderInfo.server).indexOf(server.id) >= 0) {
            $scope.account.accountServerObj[server.id] = true;
          } else {
            $scope.account.accountServerObj[server.id] = false;
          }
        });
      }
    };
    $scope.$watch('account.orderId', selectOrder);
    $scope.$watch('account.fromOrder', selectOrder);
    $scope.cancel = () => {
      $state.go('admin.account');
    };
    $scope.confirm = () => {
      $scope.account.autoRemoveDelay = $filter('timeStr2Num')($scope.account.autoRemoveDelayStr);
      alertDialog.loading();
      $scope.account.flow = $filter('flowStr2Num')($scope.account.flowStr);
      // if($scope.account.server) {
      //   $scope.servers.forEach(server => {
      //     if($scope.account.server.indexOf(server.id) >= 0) {
      //       $scope.account.accountServerObj[server.id] = true;
      //     } else {
      //       $scope.account.accountServerObj[server.id] = false;
      //     }
      //   });
      // }
      // const server = Object.keys($scope.account.accountServerObj).map(m => $scope.account.accountServerObj[m] ? +m : null).filter(f => f);
      $http.post('/api/admin/account', {
        type: +$scope.account.type,
        orderId: $scope.account.fromOrder ? +$scope.account.orderId : 0,
        port: +$scope.account.port,
        password: $scope.account.password,
        time: $scope.account.time,
        limit: +$scope.account.limit,
        flow: +$scope.account.flow,
        autoRemove: $scope.account.autoRemove ? 1 : 0,
        autoRemoveDelay: $scope.account.autoRemoveDelay,
        multiServerFlow: $scope.account.multiServerFlow ? 1 : 0,
        server: $scope.account.server,
        user: $scope.account.user,
      }).then(success => {
        alertDialog.show('添加账号成功', '确定');
        $state.go('admin.accountPage', { accountId: success.data.id });
      }).catch(() => {
        alertDialog.show('添加账号失败', '确定');
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
    $http.get('/api/admin/server').then(success => {
      $scope.servers = success.data;
    });
    $scope.accountUser = {
      search: '',
      searchChange: function(search) {},
      selectedItemChange: function(item) {
        $scope.account.user = item ? item.id : null;
      },
      querySearch: function(search) {
        return $http.get('/api/admin/user', { params: { pageSize: 5, group: -1, search, type: 'normal' }}).then(success => success.data.users);
      }
    };
    $scope.setAccountServer = () => {
      setAccountServerDialog.show($scope.account, $scope.servers);
    };
    const setServers = () => {
      if(!$scope.account.accountServerObj) { return; }
      const server = Object.keys($scope.account.accountServerObj).map(m => $scope.account.accountServerObj[m] ? +m : null).filter(f => f);
      $scope.account.server = ($scope.account.accountServer && +$scope.account.type > 1) ? server : null;
    };
    $scope.$watch('account.accountServerObj', () => {
      setServers();
    }, true);
    $scope.$watch('account.accountServer', () => {
      setServers();
    }, true);
  }
])
.controller('AdminEditAccountController', ['$scope', '$state', '$stateParams', '$http', '$mdBottomSheet', 'confirmDialog', 'alertDialog', '$filter', '$q', 'setAccountServerDialog',
  ($scope, $state, $stateParams, $http, $mdBottomSheet, confirmDialog, alertDialog, $filter, $q, setAccountServerDialog) => {
    $scope.setTitle('编辑账号');
    $scope.setMenuButton('arrow_back', function() {
      $state.go('admin.accountPage', { accountId: $stateParams.accountId });
    });
    $scope.typeList = [
      {key: '不限量', value: 1},
      {key: '月', value: 3},
      {key: '周', value: 2},
      {key: '天', value: 4},
      {key: '小时', value: 5},
    ];
    $scope.timeLimit = {
      '2': 7 * 24 * 3600000,
      '3': 30 * 24 * 3600000,
      '4': 24 * 3600000,
      '5': 3600000,
    };
    $scope.account = {
      fromOrder: 0,
      time: Date.now(),
      limit: 1,
      flow: 100,
      autoRemove: 0,
    };
    const selectOrder = (newValue, oldValue) => {
      if(newValue === oldValue) { return; }
      if(!$scope.account.fromOrder) { return; }
      let orderInfo = $scope.orders.filter(f => +f.id === +$scope.account.orderId)[0];
      if(!orderInfo) {
        orderInfo = $scope.orders[0];
        $scope.account.orderId = orderInfo.id;
      }
      let expire;
      if($scope.account.fixedExpire) {
        expire = $scope.account.time + $scope.timeLimit[$scope.account.type] * $scope.account.limit;
      }
      $scope.account.type = orderInfo.type;
      $scope.account.flow = orderInfo.flow;
      $scope.account.limit = orderInfo.cycle;
      $scope.account.autoRemove = orderInfo.autoRemove;
      $scope.account.autoRemoveDelay = orderInfo.autoRemoveDelay;
      $scope.account.multiServerFlow = orderInfo.multiServerFlow;
      $scope.account.accountServer = !!orderInfo.server;
      $scope.account.flowStr = $filter('flowNum2Str')($scope.account.flow);
      $scope.account.autoRemoveDelayStr = $filter('timeNum2Str')(orderInfo.autoRemoveDelay);
      if($scope.account.fixedExpire) {
        $scope.account.time = expire - $scope.timeLimit[$scope.account.type] * $scope.account.limit;
        while($scope.account.time >= Date.now()) {
          $scope.account.time -= $scope.timeLimit[$scope.account.type];
          $scope.account.limit++;
        }
      }
      if(orderInfo.server) {
        $scope.servers.forEach(server => {
          if(JSON.parse(orderInfo.server).indexOf(server.id) >= 0) {
            $scope.account.accountServerObj[server.id] = true;
          } else {
            $scope.account.accountServerObj[server.id] = false;
          }
        });
      }
    };
    const accountId = $stateParams.accountId;
    $q.all([
      $http.get('/api/admin/server'),
      $http.get(`/api/admin/account/${ accountId }`),
      $http.get('/api/admin/order'),
    ]).then(success => {
      $scope.orders = success[2].data.filter(f => !f.baseId);
      $scope.account.orderId = success[2].data[0].id;
      $scope.servers = success[0].data;
      $scope.account.type = success[1].data.type;
      if(success[1].data.orderId) {
        $scope.account.fromOrder = 1;
      }
      $scope.account.orderId = success[1].data.orderId;
      $scope.account.port = success[1].data.port;
      $scope.account.password = success[1].data.password;
      $scope.account.cleanFlow = false;
      $scope.account.autoRemove = success[1].data.autoRemove;
      $scope.account.autoRemoveDelay = success[1].data.autoRemoveDelay;
      $scope.account.autoRemoveDelayStr = $filter('timeNum2Str')($scope.account.autoRemoveDelay);;
      $scope.account.multiServerFlow = success[1].data.multiServerFlow;
      if(success[1].data.type >= 2 && success[1].data.type <= 5) {
        $scope.account.time = success[1].data.data.create;
        $scope.account.limit = success[1].data.data.limit;
        $scope.account.flow = success[1].data.data.flow;
        $scope.account.flowStr = $filter('flowNum2Str')($scope.account.flow);
      }
      $scope.account.server = success[1].data.server;
      $scope.account.accountServer = !!$scope.account.server;
      $scope.account.accountServerObj = {};
      if($scope.account.server) {
        $scope.servers.forEach(server => {
          if($scope.account.server.indexOf(server.id) >= 0) {
            $scope.account.accountServerObj[server.id] = true;
          } else {
            $scope.account.accountServerObj[server.id] = false;
          }
        });
      }
      $scope.$watch('account.orderId', selectOrder);
      $scope.$watch('account.fromOrder', selectOrder);
    });
    $scope.cancel = () => {
      $state.go('admin.accountPage', { accountId: $stateParams.accountId });
    };
    $scope.confirm = () => {
      $scope.account.autoRemoveDelay = $filter('timeStr2Num')($scope.account.autoRemoveDelayStr);
      alertDialog.loading();
      $scope.account.flow = $filter('flowStr2Num')($scope.account.flowStr);
      $http.put(`/api/admin/account/${ accountId }/data`, {
        type: +$scope.account.type,
        orderId: $scope.account.fromOrder ? +$scope.account.orderId : 0,
        port: +$scope.account.port,
        password: $scope.account.password,
        time: $scope.account.time,
        limit: +$scope.account.limit,
        flow: +$scope.account.flow,
        cleanFlow: $scope.account.cleanFlow,
        autoRemove: $scope.account.autoRemove ? 1 : 0,
        autoRemoveDelay: $scope.account.autoRemoveDelay,
        multiServerFlow: $scope.account.multiServerFlow ? 1 : 0,
        server: $scope.account.server,
      }).then(success => {
        alertDialog.show('修改账号成功', '确定');
        $state.go('admin.accountPage', { accountId: $stateParams.accountId });
      }).catch(() => {
        alertDialog.show('修改账号失败', '确定');
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
    $scope.setStartTimeToCurrentTime = () => {
      $scope.account.time = Date.now();
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
    $scope.setAccountServer = () => {
      setAccountServerDialog.show($scope.account, $scope.servers);
    };
    const setServers = () => {
      if(!$scope.account.accountServerObj) { return; }
      const server = Object.keys($scope.account.accountServerObj).map(m => $scope.account.accountServerObj[m] ? +m : null).filter(f => f);
      $scope.account.server = ($scope.account.accountServer && +$scope.account.type > 1) ? server : null;
    };
    $scope.$watch('account.accountServerObj', () => {
      setServers();
    }, true);
    $scope.$watch('account.accountServer', () => {
      setServers();
    }, true);
  }
]);
