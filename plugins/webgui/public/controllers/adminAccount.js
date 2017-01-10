const app = require('../index').app;

app.controller('AdminAccountController', ['$scope', '$state', '$stateParams', '$http',
  ($scope, $state, $stateParams, $http) => {
    $scope.setTitle('账号');
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
    $scope.setTitle('账号');
    $scope.setMenuButton('arrow_back', function() {
      $state.go('admin.account');
    });
    $http.get('/api/admin/account/' + $stateParams.accountId).then(success => {
      $scope.account = success.data;
      $scope.setTitle('账号 > ' + $scope.account.port);
    });
    $http.get('/api/admin/server').then(success => {
      $scope.servers = success.data;
    });
    $scope.getServerPortFlow = (serverId, port) => {
      $http.get(`/api/admin/flow/${ serverId }/${ port }`).then(success => {
        $scope.serverPortFlow = success.data[0];
      });
    };
    const base64Encode = str => {
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
      }));
    };
    $scope.createQrCode = (method, password, host, port) => {
      return 'ss://' + base64Encode(method + ':' + password + '@' + host + ':' + port);
    };
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
]);
