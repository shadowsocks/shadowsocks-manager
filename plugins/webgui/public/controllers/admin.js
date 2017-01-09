const app = require('../index').app;

app.controller('AdminController', ['$scope', '$mdMedia', '$mdSidenav', '$state', '$http',
  ($scope, $mdMedia, $mdSidenav, $state, $http) => {
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
      name: '续费码',
      icon: 'attach_money',
      click: 'admin.server',
    }, {
      name: '设置',
      icon: 'settings',
      click: 'admin.server',
    }, {
      name: '退出',
      icon: 'exit_to_app',
      click: function() {
        $http.post('/api/logout');
        $state.go('home.index');
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
    $scope.fabButton = false;
    $scope.fabButtonClick = () => {};
    $scope.setFabButton = (fn) => {
      $scope.fabButton = true;
      $scope.fabButtonClick = fn;
    };
    $scope.$on('$stateChangeStart', function(event, toUrl, fromUrl) {
      $scope.fabButton = false;
    });
  }
])
.controller('AdminIndexController', ['$scope',
  ($scope) => {
    console.log('Index');
  }
])
.controller('AdminServerController', ['$scope', '$http', '$state', 'moment',
  ($scope, $http, $state, moment) => {
    $http.get('/api/admin/server').then(success => {
      $scope.servers = success.data;
      $scope.servers.forEach(server => {
        server.flow = {};
        $http.get('/api/admin/flow/' + server.id, {
          params: {
            time: [
              moment().hour(0).minute(0).second(0).millisecond(0).toDate().valueOf(),
              moment().toDate().valueOf(),
            ],
          }
        }).then(success => {
          server.flow.today = success.data[0];
        });
        $http.get('/api/admin/flow/' + server.id, {
          params: {
            time: [
              moment().day(0).hour(0).minute(0).second(0).millisecond(0).toDate().valueOf(),
              moment().toDate().valueOf(),
            ],
          }
        }).then(success => {
          server.flow.week = success.data[0];
        });
        $http.get('/api/admin/flow/' + server.id, {
          params: {
            time: [
              moment().date(1).hour(0).minute(0).second(0).millisecond(0).toDate().valueOf(),
              moment().toDate().valueOf(),
            ],
          }
        }).then(success => {
          server.flow.month = success.data[0];
        });
        $http.get('/api/admin/flow/' + server.id, {
          params: {
            type: 'hour',
          }
        }).then(success => {
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
          server.chart = {
            data: [success.data],
            labels: ['0', '', '', '15', '', '', '30', '', '', '45', '', ''],
            // labels: ['0', '', '', '', '', '', '6', '', '', '', '', '', '12', '', '', '', '', '', '18', '', '', '', '', '', ],
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
        });
      });
    });
    $scope.toServerPage = (serverId) => {
      $state.go('admin.serverPage', { serverId });
    };
    $scope.setFabButton(() => {
      $state.go('admin.addServer');
    });
  }
])
.controller('AdminServerPageController', ['$scope', '$state', '$stateParams', '$http',
  ($scope, $state, $stateParams, $http) => {
    $http.get('/api/admin/server/' + $stateParams.serverId).then(success => {
      $scope.server = success.data;
    });
  }
])
.controller('AdminAddServerController', ['$scope', '$state', '$stateParams', '$http',
  ($scope, $state, $stateParams, $http) => {
    $scope.server = {};
    $scope.confirm = () => {
      $http.post('/api/admin/server', {
        name: $scope.server.name,
        address: $scope.server.address,
        port: +$scope.server.port,
        password: $scope.server.password,
      }).then(success => {
        $state.go('admin.server');
      });
    };
    $scope.cancel = () => {
      $state.go('admin.server');
    };
  }
])
.controller('AdminUserController', ['$scope', '$state', '$stateParams', '$http',
  ($scope, $state, $stateParams, $http) => {
    $http.get('/api/admin/user').then(success => {
      $scope.users = success.data;
    });
    $scope.toUser = (id) => {
      $state.go('admin.userPage', { userId: id });
    };
  }
])
.controller('AdminAccountController', ['$scope', '$state', '$stateParams', '$http',
  ($scope, $state, $stateParams, $http) => {
    const getAccount = () => {
      $http.get('/api/admin/account').then(success => {
        $scope.account = success.data;
      });
    };
    getAccount();
    $scope.setFabButton(() => {
      $state.go('admin.addAccount');
    });
    // $scope.deleteAccount = (id) => {
    //   $http.delete('/api/admin/account/' + id).then(success => {
    //     getAccount();
    //   });
    // };
    $scope.toAccount = id => {
      $state.go('admin.accountPage', { accountId: id });
    };
    $scope.editAccount = id => {
      $state.go('admin.editAccount', { accountId: id });
    };
  }
])
.controller('AdminAccountPageController', ['$scope', '$state', '$stateParams', '$http',
  ($scope, $state, $stateParams, $http) => {
    $http.get('/api/admin/account/' + $stateParams.accountId).then(success => {
      $scope.account = success.data;
    });
    $scope.editAccount = id => {
      $state.go('admin.editAccount', { accountId: id });
    };
  }
])
.controller('AdminAddAccountController', ['$scope', '$state', '$stateParams', '$http', '$mdBottomSheet',
  ($scope, $state, $stateParams, $http, $mdBottomSheet) => {
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
      }).then(success => {
        $state.go('admin.account');
      });
    };
    $scope.pickTime = () => {
      $mdBottomSheet.show({
        templateUrl: '/public/views/admin/picktime.html',
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
.controller('AdminEditAccountController', ['$scope', '$state', '$stateParams', '$http', '$mdBottomSheet',
  ($scope, $state, $stateParams, $http, $mdBottomSheet) => {
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
    };
    const accountId = $stateParams.accountId;
    $http.get('/api/admin/account/' + accountId).then(success => {
      $scope.account.type = success.data.type;
      $scope.account.port = success.data.port;
      $scope.account.password = success.data.password;
      if(success.data.type >= 2 && success.data.type <= 5) {
        $scope.account.time = success.data.data.create;
        $scope.account.limit = success.data.data.limit;
        $scope.account.flow = success.data.data.flow / 1000000;
      }
    });
    $scope.cancel = () => {
      $state.go('admin.account');
    };
    $scope.confirm = () => {
      $http.put('/api/admin/account/' + accountId + '/data', {
        type: +$scope.account.type,
        port: +$scope.account.port,
        password: $scope.account.password,
        time: $scope.account.time,
        limit: +$scope.account.limit,
        flow: +$scope.account.flow * 1000 * 1000,
      }).then(success => {
        $state.go('admin.account');
      });
    };
    $scope.pickTime = () => {
      $mdBottomSheet.show({
        templateUrl: '/public/views/admin/picktime.html',
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
      $http.delete('/api/admin/account/' + accountId).then(success => {
        $state.go('admin.account');
      });
    };
  }
])
.controller('AdminUserPageController', ['$scope', '$state', '$stateParams', '$http', '$mdDialog',
  ($scope, $state, $stateParams, $http, $mdDialog) => {
    const userId = $stateParams.userId;
    const getUserData = () => {
      $http.get('/api/admin/user/' + $stateParams.userId).then(success => {
        $scope.user = success.data;
      });
      $http.get('/api/admin/user/account').then(success => {
        $scope.account = success.data;
      });
    };
    getUserData();
    $scope.deleteUserAccount = (accountId) => {
      $http.delete(`/api/admin/user/${ userId }/${ accountId }`).then(success => {
        getUserData();
      });
    };
    const openDialog = () => {
      $scope.dialog = $mdDialog.show({
        templateUrl: '/public/views/admin/pickaccount.html',
        parent: angular.element(document.body),
        clickOutsideToClose:true,
        preserveScope: true,
        scope: $scope,
      });
    };
    $scope.setFabButton(() => {
      openDialog();
    });
    $scope.confirmAccount = () => {
      console.log($scope.account);
      $mdDialog.hide($scope.dialog);
      const promise = [];
      $scope.account.forEach(f => {
        if(f.isChecked) {
          promise.push($http.put(`/api/admin/user/${ userId }/${ f.id }`));
        }
      });
      Promise.all(promise).then(success => {
        getUserData();
      });
    };
  }
])
;
