/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	__webpack_require__(1);

	__webpack_require__(2);
	__webpack_require__(3);
	__webpack_require__(4);
	__webpack_require__(5);

	__webpack_require__(6);
	__webpack_require__(7);
	__webpack_require__(8);

	__webpack_require__(9);

/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';

	exports.app = angular.module('app', ['ngMaterial', 'ui.router', 'ngMessages', 'ja.qr', 'chart.js', 'angularMoment']);

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var app = __webpack_require__(1).app;

	app.controller('MainController', ['$scope', function ($scope) {}]);

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var app = __webpack_require__(1).app;

	app.controller('HomeController', ['$scope', '$mdMedia', '$mdSidenav', '$state', '$http', function ($scope, $mdMedia, $mdSidenav, $state, $http) {
	  console.log('Home');
	  $http.get('/api/login').then(function (success) {
	    if (success.data.status === 'normal') {
	      $state.go('user.index');
	    } else if (success.data.status === 'admin') {
	      $state.go('admin.index');
	    }
	  });
	  $scope.innerSideNav = true;
	  $scope.menuButton = function () {
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
	  $scope.menuClick = function (index) {
	    $mdSidenav('left').close();
	    $state.go($scope.menus[index].click);
	  };
	}]).controller('IndexController', ['$scope', function ($scope) {
	  console.log('Index');
	}]).controller('LoginController', ['$scope', '$http', '$state', function ($scope, $http, $state) {
	  console.log('Login');
	  $scope.user = {};
	  $scope.login = function () {
	    $http.post('/api/login', {
	      email: $scope.user.email,
	      password: $scope.user.password
	    }).then(function (success) {
	      if (success.data.type === 'normal') {
	        $state.go('user.index');
	      } else if (success.data.type === 'admin') {
	        $state.go('admin.index');
	      } else {}
	    }).catch(console.log);
	  };
	}]);

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var app = __webpack_require__(1).app;

	app.controller('UserController', ['$scope', '$mdMedia', '$mdSidenav', '$state', '$http', function ($scope, $mdMedia, $mdSidenav, $state, $http) {
	  console.log('Home');
	  $scope.innerSideNav = true;
	  $scope.menuButton = function () {
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
	    name: '退出',
	    icon: 'settings',
	    click: function click() {
	      $http.post('/api/logout');
	      $state.go('home.index');
	    }
	  }];
	  $scope.menuClick = function (index) {
	    $mdSidenav('left').close();
	    if (typeof $scope.menus[index].click === 'function') {
	      $scope.menus[index].click();
	    } else {
	      $state.go($scope.menus[index].click);
	    }
	  };
	}]).controller('UserIndexController', ['$scope', function ($scope) {
	  console.log('Index');
	}]);

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var app = __webpack_require__(1).app;

	app.controller('AdminController', ['$scope', '$mdMedia', '$mdSidenav', '$state', '$http', function ($scope, $mdMedia, $mdSidenav, $state, $http) {
	  $scope.innerSideNav = true;
	  $scope.menuButton = function () {
	    if ($mdMedia('gt-sm')) {
	      $scope.innerSideNav = !$scope.innerSideNav;
	    } else {
	      $mdSidenav('left').toggle();
	    }
	  };
	  $scope.menus = [{
	    name: '首页',
	    icon: 'home',
	    click: 'admin.index'
	  }, {
	    name: '服务器',
	    icon: 'cloud',
	    click: 'admin.server'
	  }, {
	    name: '用户',
	    icon: 'people',
	    click: 'admin.user'
	  }, {
	    name: '账号',
	    icon: 'account_circle',
	    click: 'admin.account'
	  }, {
	    name: '续费码',
	    icon: 'attach_money',
	    click: 'admin.server'
	  }, {
	    name: '设置',
	    icon: 'settings',
	    click: 'admin.server'
	  }, {
	    name: '退出',
	    icon: 'exit_to_app',
	    click: function click() {
	      $http.post('/api/logout');
	      $state.go('home.index');
	    }
	  }];
	  $scope.menuClick = function (index) {
	    $mdSidenav('left').close();
	    if (typeof $scope.menus[index].click === 'function') {
	      $scope.menus[index].click();
	    } else {
	      $state.go($scope.menus[index].click);
	    }
	  };
	  $scope.fabButton = false;
	  $scope.fabButtonClick = function () {};
	  $scope.setFabButton = function (fn) {
	    $scope.fabButton = true;
	    $scope.fabButtonClick = fn;
	  };
	  $scope.$on('$stateChangeStart', function (event, toUrl, fromUrl) {
	    $scope.fabButton = false;
	  });
	}]).controller('AdminIndexController', ['$scope', function ($scope) {
	  console.log('Index');
	}]).controller('AdminServerController', ['$scope', '$http', '$state', 'moment', function ($scope, $http, $state, moment) {
	  $http.get('/api/admin/server').then(function (success) {
	    $scope.servers = success.data;
	    $scope.servers.forEach(function (server) {
	      server.flow = {};
	      $http.get('/api/admin/flow/' + server.id, {
	        params: {
	          time: [moment().hour(0).minute(0).second(0).millisecond(0).toDate().valueOf(), moment().toDate().valueOf()]
	        }
	      }).then(function (success) {
	        server.flow.today = success.data[0];
	      });
	      $http.get('/api/admin/flow/' + server.id, {
	        params: {
	          time: [moment().day(0).hour(0).minute(0).second(0).millisecond(0).toDate().valueOf(), moment().toDate().valueOf()]
	        }
	      }).then(function (success) {
	        server.flow.week = success.data[0];
	      });
	      $http.get('/api/admin/flow/' + server.id, {
	        params: {
	          time: [moment().date(1).hour(0).minute(0).second(0).millisecond(0).toDate().valueOf(), moment().toDate().valueOf()]
	        }
	      }).then(function (success) {
	        server.flow.month = success.data[0];
	      });
	      $http.get('/api/admin/flow/' + server.id, {
	        params: {
	          type: 'hour'
	        }
	      }).then(function (success) {
	        var scaleLabel = function scaleLabel(number) {
	          if (number < 1) {
	            return number.toFixed(1) + ' B';
	          } else if (number < 1000) {
	            return number.toFixed(0) + ' B';
	          } else if (number < 1000000) {
	            return (number / 1000).toFixed(0) + ' KB';
	          } else if (number < 1000000000) {
	            return (number / 1000000).toFixed(0) + ' MB';
	          } else if (number < 1000000000000) {
	            return (number / 1000000000).toFixed(1) + ' GB';
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
	                label: function label(tooltipItem) {
	                  return scaleLabel(tooltipItem.yLabel);
	                }
	              }
	            },
	            scales: {
	              yAxes: [{
	                id: 'y-axis-1',
	                type: 'linear',
	                display: true,
	                position: 'left',
	                ticks: {
	                  callback: scaleLabel
	                }
	              }]
	            }
	          }
	        };
	      });
	    });
	  });
	  $scope.toServerPage = function (serverId) {
	    $state.go('admin.serverPage', { serverId: serverId });
	  };
	  $scope.setFabButton(function () {
	    $state.go('admin.addServer');
	  });
	}]).controller('AdminServerPageController', ['$scope', '$state', '$stateParams', '$http', function ($scope, $state, $stateParams, $http) {
	  $http.get('/api/admin/server/' + $stateParams.serverId).then(function (success) {
	    $scope.server = success.data;
	  });
	}]).controller('AdminAddServerController', ['$scope', '$state', '$stateParams', '$http', function ($scope, $state, $stateParams, $http) {
	  $scope.server = {};
	  $scope.confirm = function () {
	    $http.post('/api/admin/server', {
	      name: $scope.server.name,
	      address: $scope.server.address,
	      port: +$scope.server.port,
	      password: $scope.server.password
	    }).then(function (success) {
	      $state.go('admin.server');
	    });
	  };
	  $scope.cancel = function () {
	    $state.go('admin.server');
	  };
	}]).controller('AdminUserController', ['$scope', '$state', '$stateParams', '$http', function ($scope, $state, $stateParams, $http) {
	  $http.get('/api/admin/user').then(function (success) {
	    $scope.users = success.data;
	  });
	  $scope.toUser = function (id) {
	    $state.go('admin.userPage', { userId: id });
	  };
	}]).controller('AdminAccountController', ['$scope', '$state', '$stateParams', '$http', function ($scope, $state, $stateParams, $http) {
	  var getAccount = function getAccount() {
	    $http.get('/api/admin/account').then(function (success) {
	      $scope.account = success.data;
	    });
	  };
	  getAccount();
	  $scope.setFabButton(function () {
	    $state.go('admin.addAccount');
	  });
	  // $scope.deleteAccount = (id) => {
	  //   $http.delete('/api/admin/account/' + id).then(success => {
	  //     getAccount();
	  //   });
	  // };
	  $scope.editAccount = function (id) {
	    $state.go('admin.editAccount', { accountId: id });
	  };
	}]).controller('AdminAddAccountController', ['$scope', '$state', '$stateParams', '$http', '$mdBottomSheet', function ($scope, $state, $stateParams, $http, $mdBottomSheet) {
	  $scope.typeList = [{ key: '不限量', value: 1 }, { key: '按周', value: 2 }, { key: '按月', value: 3 }, { key: '按天', value: 4 }, { key: '小时', value: 5 }];
	  $scope.timeLimit = {
	    '2': 7 * 24 * 3600000,
	    '3': 30 * 24 * 3600000,
	    '4': 24 * 3600000,
	    '5': 3600000
	  };
	  $scope.account = {
	    time: Date.now(),
	    limit: 1,
	    flow: 100
	  };
	  $scope.cancel = function () {
	    $state.go('admin.account');
	  };
	  $scope.confirm = function () {
	    $http.post('/api/admin/account', {
	      type: +$scope.account.type,
	      port: +$scope.account.port,
	      password: $scope.account.password,
	      time: $scope.account.time,
	      limit: +$scope.account.limit,
	      flow: +$scope.account.flow * 1000 * 1000
	    }).then(function (success) {
	      $state.go('admin.account');
	    });
	  };
	  $scope.pickTime = function () {
	    $mdBottomSheet.show({
	      templateUrl: '/public/views/admin/picktime.html',
	      preserveScope: true,
	      scope: $scope
	    });
	  };
	  $scope.setStartTime = function (number) {
	    $scope.account.time += number;
	  };
	  $scope.setLimit = function (number) {
	    $scope.account.limit += number;
	    if ($scope.account.limit < 1) {
	      $scope.account.limit = 1;
	    }
	  };
	}]).controller('AdminEditAccountController', ['$scope', '$state', '$stateParams', '$http', '$mdBottomSheet', function ($scope, $state, $stateParams, $http, $mdBottomSheet) {
	  $scope.typeList = [{ key: '不限量', value: 1 }, { key: '按周', value: 2 }, { key: '按月', value: 3 }, { key: '按天', value: 4 }, { key: '小时', value: 5 }];
	  $scope.timeLimit = {
	    '2': 7 * 24 * 3600000,
	    '3': 30 * 24 * 3600000,
	    '4': 24 * 3600000,
	    '5': 3600000
	  };
	  $scope.account = {
	    time: Date.now(),
	    limit: 1,
	    flow: 100
	  };
	  var accountId = $stateParams.accountId;
	  $http.get('/api/admin/account/' + accountId).then(function (success) {
	    $scope.account.type = success.data.type;
	    $scope.account.port = success.data.port;
	    $scope.account.password = success.data.password;
	    if (success.data.type >= 2 && success.data.type <= 5) {
	      $scope.account.time = success.data.data.create;
	      $scope.account.limit = success.data.data.limit;
	      $scope.account.flow = success.data.data.flow / 1000000;
	    }
	  });
	  $scope.cancel = function () {
	    $state.go('admin.account');
	  };
	  $scope.confirm = function () {
	    $http.put('/api/admin/account/' + accountId + '/data', {
	      type: +$scope.account.type,
	      port: +$scope.account.port,
	      password: $scope.account.password,
	      time: $scope.account.time,
	      limit: +$scope.account.limit,
	      flow: +$scope.account.flow * 1000 * 1000
	    }).then(function (success) {
	      $state.go('admin.account');
	    });
	  };
	  $scope.pickTime = function () {
	    $mdBottomSheet.show({
	      templateUrl: '/public/views/admin/picktime.html',
	      preserveScope: true,
	      scope: $scope
	    });
	  };
	  $scope.setStartTime = function (number) {
	    $scope.account.time += number;
	  };
	  $scope.setLimit = function (number) {
	    $scope.account.limit += number;
	    if ($scope.account.limit < 1) {
	      $scope.account.limit = 1;
	    }
	  };
	  $scope.deleteAccount = function () {
	    $http.delete('/api/admin/account/' + accountId).then(function (success) {
	      $state.go('admin.account');
	    });
	  };
	}]).controller('AdminUserPageController', ['$scope', '$state', '$stateParams', '$http', function ($scope, $state, $stateParams, $http) {
	  // $http.get('/api/admin/user').then(success => {
	  //   $scope.users = success.data;
	  // });
	}]);

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var app = __webpack_require__(1).app;

	app.config(['$urlRouterProvider', '$locationProvider', function ($urlRouterProvider, $locationProvider) {
	  $locationProvider.html5Mode(true);
	  $urlRouterProvider.when('/', '/home/index').otherwise('/home/index');
	}]);

	app.config(['$stateProvider', function ($stateProvider) {
	  $stateProvider.state('home', {
	    url: '/home',
	    abstract: true,
	    templateUrl: '/public/views/home/home.html'
	  }).state('home.index', {
	    url: '/index',
	    controller: 'IndexController',
	    templateUrl: '/public/views/home/index.html'
	  }).state('home.login', {
	    url: '/login',
	    controller: 'LoginController',
	    templateUrl: '/public/views/home/login.html'
	  }).state('home.signup', {
	    url: '/signup',
	    controller: 'SignupController',
	    templateUrl: '/public/views/home/signup.html'
	  });
	}]);

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var app = __webpack_require__(1).app;

	app.config(['$stateProvider', function ($stateProvider) {
	  $stateProvider.state('user', {
	    url: '/user',
	    abstract: true,
	    templateUrl: '/public/views/user/user.html'
	  }).state('user.index', {
	    url: '/index',
	    controller: 'UserIndexController',
	    templateUrl: '/public/views/user/index.html'
	  });
	}]);

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var app = __webpack_require__(1).app;

	app.config(['$stateProvider', function ($stateProvider) {
	  $stateProvider.state('admin', {
	    url: '/admin',
	    abstract: true,
	    templateUrl: '/public/views/admin/admin.html'
	  }).state('admin.index', {
	    url: '/index',
	    controller: 'AdminIndexController',
	    templateUrl: '/public/views/admin/index.html'
	  }).state('admin.server', {
	    url: '/server',
	    controller: 'AdminServerController',
	    templateUrl: '/public/views/admin/server.html'
	  }).state('admin.serverPage', {
	    url: '/server/:serverId',
	    controller: 'AdminServerPageController',
	    templateUrl: '/public/views/admin/serverPage.html'
	  }).state('admin.addServer', {
	    url: '/addServer',
	    controller: 'AdminAddServerController',
	    templateUrl: '/public/views/admin/addServer.html'
	  }).state('admin.user', {
	    url: '/user',
	    controller: 'AdminUserController',
	    templateUrl: '/public/views/admin/user.html'
	  }).state('admin.account', {
	    url: '/account',
	    controller: 'AdminAccountController',
	    templateUrl: '/public/views/admin/account.html'
	  }).state('admin.addAccount', {
	    url: '/addAccount',
	    controller: 'AdminAddAccountController',
	    templateUrl: '/public/views/admin/addAccount.html'
	  }).state('admin.editAccount', {
	    url: '/account/:accountId/edit',
	    controller: 'AdminEditAccountController',
	    templateUrl: '/public/views/admin/editAccount.html'
	  }).state('admin.userPage', {
	    url: '/user/:userId',
	    controller: 'AdminUserPageController',
	    templateUrl: '/public/views/admin/userPage.html'
	  });
	}]);

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var app = __webpack_require__(1).app;

	app.filter('flow', function () {
	  return function (input) {
	    if (input < 1000) {
	      return input + ' B';
	    } else if (input < 1000000) {
	      return (input / 1000).toFixed(1) + ' KB';
	    } else if (input < 1000000000) {
	      return (input / 1000000).toFixed(1) + ' MB';
	    } else if (input < 1000000000000) {
	      return (input / 1000000000).toFixed(2) + ' GB';
	    } else {
	      return input;
	    }
	  };
	});

/***/ }
/******/ ]);