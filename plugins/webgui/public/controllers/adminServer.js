const app = angular.module('app');

app.controller('AdminServerController', ['$scope', '$http', '$state', 'moment', '$localStorage', 'adminApi', '$timeout', '$interval', 'serverChartDialog',
  ($scope, $http, $state, moment, $localStorage, adminApi, $timeout, $interval, serverChartDialog) => {
    $scope.setTitle('服务器');
    $scope.setMenuSearchButton('search');
    $scope.setMenuRightButton('timeline');
    if(!$localStorage.admin.serverChart) {
      $localStorage.admin.serverChart = { showFlow: true, showChart: true };
    }
    $scope.serverChart = $localStorage.admin.serverChart;
    $scope.$on('RightButtonClick', () => {
      serverChartDialog.show($scope.serverChart);
    });
    const scaleLabel = number => {
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
    $scope.chart = {
      labels: ['', '', '', '', '', '', '', '', '', '', '', ''],
      series: 'day',
      datasetOverride: [{ yAxisID: 'y-axis-1' }],
      options: {
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
    if(!$localStorage.admin.serverInfo) {
      $localStorage.admin.serverInfo = {
        time: Date.now(),
        data: [],
      };
    }
    $scope.servers = $localStorage.admin.serverInfo.data;
    $scope.online = {};
    const updateServerInfo = () => {
      $http.get('/api/admin/account/online').then(success => {
        $scope.online = success.data;
      });
      adminApi.getServer(true).then(servers => {
        if(servers.map(s => s.id).join('') === $scope.servers.map(s => s.id).join('')) {
          $scope.servers.forEach((server, index) => {
            server.host = servers[index].host;
            server.name = servers[index].name;
            server.port = servers[index].port;
            server.status = servers[index].status;
            server.isGfw = servers[index].isGfw;
            adminApi.getServerFlow(server.id).then(flow => {
              if(!server.flow) {
                server.flow = {};
              }
              server.flow.today = flow.today;
              server.flow.week = flow.week;
              server.flow.month = flow.month;
            });
            if($scope.serverChart.showChart) {
              $timeout(() => {
                adminApi.getServerFlowLastHour(server.id)
                .then(success => {
                  if(!server.chart) {
                    server.chart = {
                      data: [[]],
                    };
                  }
                  success.flow.forEach((number, index) => {
                    server.chart.data[0][index] = number;
                  });
                  server.sumFlowOneHour = server.chart.data[0].reduce((a, b) => a + b);
                });
              }, index * 1000);
            }
          });
        } else {
          $localStorage.admin.serverInfo = {
            time: Date.now(),
            data: servers,
          };
          $scope.servers = servers;
          $scope.servers.forEach((server, index) => {
            adminApi.getServerFlow(server.id).then(flow => {
              server.flow = flow;
            });
            if($scope.serverChart.showChart) {
              $timeout(() => {
                adminApi.getServerFlowLastHour(server.id)
                .then(success => {
                  if(!server.chart) {
                    server.chart = {
                      data: [[]],
                    };
                  }
                  success.flow.forEach((number, index) => {
                    server.chart.data[0][index] = number;
                  });
                  server.sumFlowOneHour = server.chart.data[0].reduce((a, b) => a + b);
                });
              }, index * 1000);
            }
          });
        }
      });
    };
    updateServerInfo();
    $scope.$on('visibilitychange', (event, status) => {
      if(status === 'visible') {
        if($localStorage.admin.serverInfo && Date.now() - $localStorage.admin.serverInfo.time >= 30 * 1000) {
          updateServerInfo();
        }
      }
    });
    $scope.setInterval($interval(() => {
      if(document.visibilityState === 'visible' && $localStorage.admin.serverInfo && Date.now() - $localStorage.admin.serverInfo.time >= 90 * 1000) {
        updateServerInfo();
      }
    }, 15 * 1000));
    $scope.toServerPage = (serverId) => {
      $state.go('admin.serverPage', { serverId });
    };
    $scope.setFabButton($scope.id === 1 ? () => {
      $state.go('admin.addServer');
    } : null);
    $scope.addServer = () => {
      $state.go('admin.addServer');
    };
    $scope.showServer = serverName => {
      if(!$scope.menuSearch.text) { return true; }
      return serverName.toString().includes($scope.menuSearch.text);
    };
  }
])
.controller('AdminServerPageController', ['$scope', '$state', '$stateParams', '$http', 'moment', '$mdDialog', 'adminApi', '$localStorage', '$mdMedia', '$interval', 'banDialog',
  ($scope, $state, $stateParams, $http, moment, $mdDialog, adminApi, $localStorage, $mdMedia, $interval, banDialog) => {
    $scope.setTitle('服务器');
    $scope.setMenuButton('arrow_back', 'admin.server');
    const serverId = $stateParams.serverId;
    if(!$localStorage.admin.serverPortFilter) {
      $localStorage.admin.serverPortFilter = {
        value: 'all',
      };
    }
    $scope.accountFilter = $localStorage.admin.serverPortFilter;
    $scope.onlineAccount = [];
    $scope.getServerInfoError = false;
    const getServerInfo = () => {
      $http.get(`/api/admin/server/${ serverId }`).then(success => {
        $scope.server = success.data;
        $scope.isWg = $scope.server.type === 'WireGuard';
        $scope.currentPorts = {};
        $scope.server.ports.forEach(f => {
          $scope.currentPorts[f.port] = {
            port: f.port,
            password: f.password,
            exists: true,
          };
        });
        return $http.get('/api/admin/account/online', {
          params: { serverId }
        });
      }).then(success => {
        $scope.onlineAccount = success.data;
        return adminApi.getAccount();
      }).then(accounts => {
        accounts.forEach(account => {
          if(!$scope.currentPorts[account.port + $scope.server.shift]) {
            $scope.currentPorts[account.port + $scope.server.shift] = {
              id: account.id,
              port: account.port + $scope.server.shift,
              password: account.password,
              exists: false,
            };
          } else {
            $scope.currentPorts[account.port + $scope.server.shift].id = account.id;
          }
        });
        $scope.portNumber = Object.keys($scope.currentPorts).filter(f => {
          return $scope.currentPorts[f].exists;
        }).length;
        $scope.getServerInfoError = false;
      }).catch(() => {
        $scope.getServerInfoError = true;
      });
    };
    getServerInfo();
    $scope.setInterval($interval(() => {
      getServerInfo();
    }, 60 * 1000));
    $scope.toAccountPage = port => {
      adminApi.getAccountId(port - $scope.server.shift).then(id => {
        $state.go('admin.accountPage', { accountId: id });
      });
    };
    $scope.deleteServer = id => {
      const confirm = $mdDialog.confirm()
        .title('')
        .textContent('删除服务器？')
        .ariaLabel('deleteServer')
        .ok('确认')
        .cancel('取消');
      $mdDialog.show(confirm).then(() => {
        return $http.delete(`/api/admin/server/${ serverId }`);
      }).then(() => {
        $state.go('admin.server');
      }).catch(() => {

      });
    };

    $scope.flowType = 'day';
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
      const pieDataSort = pieData.sort((a, b) => {
        return a.flow - b.flow;
      });
      $scope.pieChart = {
        data: pieDataSort.map(m => m.flow),
        labels: pieDataSort.map(m => m.port + (m.userName ? ` [${ m.userName }]` : '')),
        options: {
          responsive: false,
          tooltips: {
            enabled: true,
            mode: 'single',
            callbacks: {
              label: function(tooltipItem, data) {
                const label = data.labels[tooltipItem.index];
                const datasetLabel = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                return [
                  label, scaleLabel(datasetLabel)
                ];
              }
            }
          },
        },
      };
      $scope.lineChart = {
        data: [lineData],
        labels: flowLabel[$scope.flowType],
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
    $scope.getChartData = () => {
      adminApi.getChartData(serverId, $scope.flowType, flowTime[$scope.flowType])
      .then(success => {
        $scope.sumFlow = success[0].data.reduce((a, b) => {
          return a + b;
        }, 0);
        setChart(success[0].data, success[1].data);
      });
      if($scope.flowType === 'hour') {
        $scope.time = moment(flowTime[$scope.flowType]).format('YYYY-MM-DD HH:00');
      }
      if($scope.flowType === 'day') {
        $scope.time = moment(flowTime[$scope.flowType]).format('YYYY-MM-DD');
      }
      if($scope.flowType === 'week') {
        $scope.time = moment(flowTime[$scope.flowType]).day(0).format('YYYY-MM-DD') + ' / ' + moment(flowTime[$scope.flowType]).day(6).format('YYYY-MM-DD');
      }
    };
    $scope.getChartData();
    $scope.changeFlowTime = (number) => {
      const time = {
        hour: 3600 * 1000,
        day: 24 * 3600 * 1000,
        week: 7 * 24 * 3600 * 1000,
      };
      flowTime[$scope.flowType] += number * time[$scope.flowType];
      $scope.getChartData();
    };
    $scope.resetFlowTime = () => {
      flowTime[$scope.flowType] = Date.now();
      $scope.getChartData();
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
    $scope.setFabButton($scope.id === 1 ? () => {
      $state.go('admin.editServer', { serverId });
    } : null, 'mode_edit');
    $scope.banAccount = (accountId) => {
      banDialog.show(serverId, accountId);
    };
    $scope.setMenuSearchButton('search');
    $scope.matchPort = (account, searchStr) => {
      let filter = true;
      let search = true;
      if($scope.accountFilter.value === 'all') {
        filter = true;
      } else if($scope.accountFilter.value === 'white') {
        filter = account.exists;
      } else if($scope.accountFilter.value === 'red') {
        filter = !account.exists;
      } else {
        filter = $scope.onlineAccount.includes(account.id);
      }
      if(!searchStr) {
        search = true;
      } else {
        search = (account.port.toString().includes(searchStr) || account.password.toString().includes(searchStr));
      }
      return filter && search;
    };
    $scope.accountColor = account => {
      if(account.exists === false) {
        return { background: 'red-50' };
      } else if($scope.onlineAccount.includes(account.id)) {
        return { background: 'blue-50' };
      }
      return {};
    };
    // $scope.$on('cancelSearch', () => {
      
    // });
    // let timeoutPromise;
    // $scope.$watch('menuSearch.text', () => {
    //   if(!$scope.menuSearch.text) { return; }
    //   timeoutPromise && $timeout.cancel(timeoutPromise);
    //   timeoutPromise = $timeout(() => {
        
    //   }, 500);
    // });
    let serverIds = [ serverId ];
    $http.get('/api/admin/server').then(success => {
      serverIds = success.data.map(s => s.id);
    });
    $scope.nextServer = () => {
      const currentIndex = serverIds.indexOf(+serverId);
      const nextServerId = serverIds[(currentIndex + 1) % serverIds.length];
      $state.go('admin.serverPage', { serverId: nextServerId });
    };
    $scope.prevServer = () => {
      const currentIndex = serverIds.indexOf(+serverId);
      const prevServerId = serverIds[(currentIndex - 1 + serverIds.length) % serverIds.length];
      $state.go('admin.serverPage', { serverId: prevServerId });
    };
  }
])
.controller('AdminAddServerController', ['$scope', '$state', '$stateParams', '$http', 'alertDialog',
  ($scope, $state, $stateParams, $http, alertDialog) => {
    $scope.setTitle('新增服务器');
    $scope.setMenuButton('arrow_back', 'admin.server');
    $scope.methods = [
      'aes-256-cfb',
      'aes-192-cfb',
      'aes-128-cfb',
      'aes-256-ctr',
      'aes-192-ctr',
      'aes-128-ctr',
      'camellia-256-cfb',
      'camellia-192-cfb',
      'camellia-128-cfb',
      'aes-256-gcm',
      'aes-192-gcm',
      'aes-128-gcm',
      'rc4-md5',
      'bf-cfb',
      'salsa20',
      'chacha20',
      'chacha20-ietf',
      'chacha20-ietf-poly1305',
      'xchacha20-ietf-poly1305'
    ];
    $scope.setMethod = () => {
      $scope.server.method = $scope.methodSearch;
    };
    $scope.server = {
      type: 'Shadowsocks',
      method: 'aes-256-cfb',
      scale: 1,
      shift: 0,
    };
    $scope.confirm = () => {
      alertDialog.loading();
      $http.post('/api/admin/server', {
        type: $scope.server.type,
        name: $scope.server.name,
        address: $scope.server.address,
        port: +$scope.server.port,
        password: $scope.server.password,
        method: $scope.server.method,
        comment: $scope.server.comment,
        scale: $scope.server.scale,
        shift: $scope.server.shift,
        key: $scope.server.key,
        net: $scope.server.net,
        wgPort: $scope.server.wgPort ? +$scope.server.wgPort : null,
      }, {
        timeout: 15000,
      }).then(success => {
        alertDialog.show('添加服务器成功', '确定');
        $state.go('admin.server');
      }).catch(() => {
        alertDialog.show('添加服务器失败', '确定');
      });
    };
    $scope.cancel = () => {
      $state.go('admin.server');
    };
  }
])
.controller('AdminEditServerController', ['$scope', '$state', '$stateParams', '$http', 'confirmDialog', 'alertDialog',
  ($scope, $state, $stateParams, $http, confirmDialog, alertDialog) => {
    $scope.setTitle('编辑服务器');
    const serverId = $stateParams.serverId;
    $scope.setMenuButton('arrow_back', function() {
      $state.go('admin.serverPage', { serverId: $stateParams.serverId });
    });
    $scope.server = { check: 1 };
    $scope.methods = [
      'aes-256-cfb',
      'aes-192-cfb',
      'aes-128-cfb',
      'aes-256-ctr',
      'aes-192-ctr',
      'aes-128-ctr',
      'camellia-256-cfb',
      'camellia-192-cfb',
      'camellia-128-cfb',
      'aes-256-gcm',
      'aes-192-gcm',
      'aes-128-gcm',
      'rc4-md5',
      'bf-cfb',
      'salsa20',
      'chacha20',
      'chacha20-ietf',
      'chacha20-ietf-poly1305',
      'xchacha20-ietf-poly1305'
    ];
    $scope.setMethod = () => {
      $scope.server.method = $scope.methodSearch;
    };
    $scope.serverInfoloaded = false;
    $http.get(`/api/admin/server/${ serverId }`, {
      params: {
        noPort: true,
      }
    })
    .then(success => {
      $scope.serverInfoloaded = true;
      $scope.server.type = success.data.type;
      $scope.server.name = success.data.name;
      $scope.server.comment = success.data.comment;
      $scope.server.address = success.data.host;
      $scope.server.port = +success.data.port;
      $scope.server.password = success.data.password;
      $scope.server.method = success.data.method;
      $scope.server.scale = success.data.scale;
      $scope.server.shift = success.data.shift;
      $scope.server.key = success.data.key;
      $scope.server.net = success.data.net;
      $scope.server.wgPort = success.data.wgPort;
    });
    $scope.confirm = () => {
      alertDialog.loading();
      $http.put('/api/admin/server/' + $stateParams.serverId, {
        type: $scope.server.type,
        name: $scope.server.name,
        address: $scope.server.address,
        port: +$scope.server.port,
        password: $scope.server.password,
        method: $scope.server.method,
        comment: $scope.server.comment,
        scale: $scope.server.scale,
        shift: $scope.server.shift,
        key: $scope.server.key,
        net: $scope.server.net,
        wgPort: $scope.server.wgPort ? +$scope.server.wgPort : null,
        check: $scope.server.check,
      }).then(success => {
        alertDialog.show('修改服务器成功', '确定');
        $state.go('admin.serverPage', { serverId: $stateParams.serverId });
      }).catch(() => {
        alertDialog.show('修改服务器失败', '确定');
      });
    };
    $scope.cancel = () => {
      $state.go('admin.serverPage', { serverId: $stateParams.serverId });
    };
    $scope.deleteServer = () => {
      confirmDialog.show({
        text: '真的要删除服务器吗？',
        cancel: '取消',
        confirm: '删除',
        error: '删除服务器失败',
        fn: function () { return $http.delete('/api/admin/server/' + $stateParams.serverId); },
      }).then(() => {
        $state.go('admin.server');
      });
    };
  }
]);
