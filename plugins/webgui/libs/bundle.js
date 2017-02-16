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
	__webpack_require__(10);
	__webpack_require__(11);

	__webpack_require__(12);
	__webpack_require__(13);
	__webpack_require__(14);
	__webpack_require__(15);
	__webpack_require__(16);
	__webpack_require__(17);
	__webpack_require__(18);
	__webpack_require__(19);

/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';

	exports.app = angular.module('app', ['ngMaterial', 'ui.router', 'ngMessages', 'ja.qr', 'chart.js', 'angularMoment', 'ngWebSocket', 'ngStorage']);

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var app = __webpack_require__(1).app;

	app.controller('MainController', ['$scope', function ($scope) {
	  $scope.mainLoading = true;
	  $scope.setMainLoading = function (status) {
	    $scope.mainLoading = status;
	  };
	}]);

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var app = __webpack_require__(1).app;

	app.controller('HomeController', ['$scope', '$mdMedia', '$mdSidenav', '$state', '$http', '$timeout', function ($scope, $mdMedia, $mdSidenav, $state, $http, $timeout) {
	  $http.get('/api/home/login').then(function (success) {
	    if (success.data.status === 'normal') {
	      $state.go('user.index');
	    } else if (success.data.status === 'admin') {
	      $state.go('admin.index');
	    } else {
	      $scope.setMainLoading(false);
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
	}]).controller('HomeIndexController', ['$scope', '$state', function ($scope, $state) {
	  $scope.icons = [{
	    icon: 'flash_on',
	    title: '快速搭建',
	    content: '仅依赖Node.js，无需安装数据库（可选MySQL）'
	  }, {
	    icon: 'build',
	    title: '易于配置',
	    content: '带有插件系统，仅需修改配置文件即可运行'
	  }, {
	    icon: 'vpn_key',
	    title: '官方标准',
	    content: '支持libev和python版本的标准manager API'
	  }];
	  $scope.login = function () {
	    $state.go('home.login');
	  };
	  $scope.signup = function () {
	    $state.go('home.signup');
	  };
	}]).controller('HomeLoginController', ['$scope', '$http', '$state', 'homeApi', 'alertDialog', function ($scope, $http, $state, homeApi, alertDialog) {
	  $scope.user = {};
	  $scope.login = function () {
	    alertDialog.loading();
	    homeApi.userLogin($scope.user.email, $scope.user.password).then(function (success) {
	      return alertDialog.close().then(function () {
	        return success;
	      });
	    }).then(function (success) {
	      if (success === 'normal') {
	        $state.go('user.index');
	      } else if (success === 'admin') {
	        $state.go('admin.index');
	      }
	    }).catch(function (err) {
	      alertDialog.show(err, '确定');
	    });
	  };
	  $scope.findPassword = function () {
	    alertDialog.loading();
	    homeApi.findPassword($scope.user.email).then(function (success) {
	      alertDialog.show(success, '确定');
	    }).catch(function (err) {
	      alertDialog.show(err, '确定');
	    });
	  };
	  $scope.enterKey = function (key) {
	    if (key.keyCode === 13) {
	      $scope.login();
	    }
	  };
	}]).controller('HomeSignupController', ['$scope', '$http', '$state', '$interval', '$timeout', 'homeApi', 'alertDialog', function ($scope, $http, $state, $interval, $timeout, homeApi, alertDialog) {
	  $scope.user = {};
	  $scope.sendCodeTime = 0;
	  $scope.sendCode = function () {
	    alertDialog.loading();
	    $http.post('/api/home/code', {
	      email: $scope.user.email
	    }).then(function (success) {
	      alertDialog.show('验证码已发至邮箱', '确定');
	      $scope.sendCodeTime = 120;
	      var interval = $interval(function () {
	        if ($scope.sendCodeTime > 0) {
	          $scope.sendCodeTime--;
	        } else {
	          $interval.cancel(interval);
	          $scope.sendCodeTime = 0;
	        }
	      }, 1000);
	    }).catch(function (err) {
	      alertDialog.show('验证码发送错误', '确定');
	    });
	  };
	  $scope.signup = function () {
	    alertDialog.loading();
	    homeApi.userSignup($scope.user.email, $scope.user.code, $scope.user.password).then(function (success) {
	      alertDialog.show('用户注册成功', '确定').then(function (success) {
	        $state.go('home.login');
	      });
	    }).catch(function (err) {
	      alertDialog.show(err, '确定');
	    });
	  };
	}]).controller('HomeResetPasswordController', ['$scope', '$http', '$state', '$stateParams', 'alertDialog', function ($scope, $http, $state, $stateParams, alertDialog) {
	  $scope.user = {};
	  var token = $stateParams.token;
	  alertDialog.loading();
	  $http.get('/api/home/password/reset', {
	    params: {
	      token: token
	    }
	  }).then(function (success) {
	    alertDialog.close();
	  }).catch(function (err) {
	    alertDialog.show('该链接已经失效', '确定').then(function () {
	      $state.go('home.index');
	    });
	  });
	  $scope.resetPassword = function () {
	    alertDialog.loading();
	    $http.post('/api/home/password/reset', {
	      token: token,
	      password: $scope.user.password
	    }).then(function () {
	      alertDialog.show('修改密码成功', '确定').then(function () {
	        $state.go('home.login');
	      });
	    }).catch(function () {
	      alertDialog.show('修改密码失败', '确定');
	    });
	  };
	}]);

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var app = __webpack_require__(1).app;

	app.controller('UserController', ['$scope', '$mdMedia', '$mdSidenav', '$state', '$http', function ($scope, $mdMedia, $mdSidenav, $state, $http) {
	  $http.get('/api/home/login').then(function (success) {
	    if (success.data.status !== 'normal') {
	      $state.go('home.index');
	    } else {
	      $scope.setMainLoading(false);
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
	    click: 'user.index'
	  }, {
	    name: '我的账号',
	    icon: 'account_circle',
	    click: 'user.account'
	  }, {
	    name: 'divider'
	  }, {
	    name: '退出',
	    icon: 'settings',
	    click: function click() {
	      $http.post('/api/home/logout');
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
	  $scope.title = '';
	  $scope.setTitle = function (str) {
	    $scope.title = str;
	  };
	  $scope.$on('$stateChangeStart', function (event, toUrl, fromUrl) {
	    $scope.title = '';
	  });
	  // $scope.ws = ws;
	}]).controller('UserIndexController', ['$scope', '$state', function ($scope, $state) {
	  $scope.setTitle('首页');
	  $scope.toMyAccount = function () {
	    $state.go('user.account');
	  };
	}]).controller('UserAccountController', ['$scope', '$http', '$mdMedia', 'userApi', '$mdDialog', 'alertDialog', 'payDialog', '$interval', function ($scope, $http, $mdMedia, userApi, $mdDialog, alertDialog, payDialog, $interval) {
	  $scope.setTitle('我的账号');
	  $scope.flexGtSm = 100;
	  userApi.getUserAccount().then(function (success) {
	    $scope.account = success.account;
	    $scope.servers = success.servers;
	    if ($scope.account.length >= 2) {
	      $scope.flexGtSm = 50;
	    }
	  });
	  var base64Encode = function base64Encode(str) {
	    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
	      return String.fromCharCode('0x' + p1);
	    }));
	  };
	  $scope.createQrCode = function (method, password, host, port) {
	    return 'ss://' + base64Encode(method + ':' + password + '@' + host + ':' + port);
	  };
	  $scope.getServerPortData = function (account, serverId, port) {
	    if (account.type >= 2 && account.type <= 5) {
	      $http.get('/api/user/flow/' + serverId + '/' + port).then(function (success) {
	        account.serverPortFlow = success.data[0];
	      });
	    }
	    $http.get('/api/user/flow/' + serverId + '/' + port + '/lastConnect').then(function (success) {
	      account.lastConnect = success.data.lastConnect;
	    });
	  };
	  $scope.getQrCodeSize = function () {
	    if ($mdMedia('xs')) {
	      return 230;
	    }
	    return 180;
	  };
	  $scope.showChangePasswordDialog = function (accountId, password) {
	    var dialog = {
	      templateUrl: '/public/views/user/changePassword.html',
	      escapeToClose: false,
	      locals: { bind: password },
	      bindToController: true,
	      controller: ['$scope', 'userApi', '$mdDialog', 'bind', function ($scope, userApi, $mdDialog, bind) {
	        $scope.account = {
	          password: bind
	        };
	        $scope.changePassword = function () {
	          $mdDialog.cancel();
	          // $http.put(`/api/user/${ accountId }/password`, {
	          //   password: $scope.account.password,
	          // });
	          userApi.changePassword(accountId, $scope.account.password);
	        };
	      }],
	      clickOutsideToClose: true
	    };
	    $mdDialog.show(dialog);
	  };
	  $scope.createOrder = function (accountId) {
	    payDialog.loading();
	    $http.post('/api/user/order/qrcode', {
	      accountId: accountId
	    }).then(function (success) {
	      payDialog.setUrl(success.data.orderId, success.data.qrCode);
	      // const int = $interval(() => {
	      //   $http.post('/api/user/order/status', {
	      //     orderId: success.data.orderId,
	      //   }).then(success => {
	      //     const orderStatus = success.data.status;
	      //     if(orderStatus === 'TRADE_SUCCESS' || orderStatus === 'FINISH') {
	      //       $interval.cancel(int);
	      //       payDialog.close();
	      //     }
	      //   });
	      // }, 10 * 1000);
	    }).catch(console.log);
	  };
	  $scope.unfinish = function () {
	    alertDialog.show('该功能尚未完成', '确定');
	  };
	}]);

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var app = __webpack_require__(1).app;

	app.controller('AdminController', ['$scope', '$mdMedia', '$mdSidenav', '$state', '$http', '$sessionStorage', function ($scope, $mdMedia, $mdSidenav, $state, $http, $sessionStorage) {
	  $sessionStorage.$default({
	    settings: {}
	  });
	  $http.get('/api/home/login').then(function (success) {
	    if (success.data.status !== 'admin') {
	      $state.go('home.index');
	    } else {
	      $scope.setMainLoading(false);
	    }
	  });
	  $scope.innerSideNav = true;
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
	    name: '续费',
	    icon: 'attach_money',
	    click: 'admin.pay'
	  }, {
	    name: '设置',
	    icon: 'settings',
	    click: 'admin.unfinished'
	  }, {
	    name: 'divider'
	  }, {
	    name: '退出',
	    icon: 'exit_to_app',
	    click: function click() {
	      $http.post('/api/home/logout');
	      $state.go('home.index');
	    }
	  }];
	  $scope.menuButton = function () {
	    if ($scope.menuButtonIcon) {
	      return $scope.menuButtonClick();
	    }
	    if ($mdMedia('gt-sm')) {
	      $scope.innerSideNav = !$scope.innerSideNav;
	    } else {
	      $mdSidenav('left').toggle();
	    }
	  };
	  $scope.menuClick = function (index) {
	    $mdSidenav('left').close();
	    if (typeof $scope.menus[index].click === 'function') {
	      $scope.menus[index].click();
	    } else {
	      $state.go($scope.menus[index].click);
	    }
	  };
	  $scope.title = '';
	  $scope.setTitle = function (str) {
	    $scope.title = str;
	  };
	  $scope.fabButton = false;
	  $scope.fabButtonClick = function () {};
	  $scope.setFabButton = function (fn) {
	    $scope.fabButton = true;
	    $scope.fabButtonClick = fn;
	  };
	  $scope.menuButtonIcon = '';
	  $scope.menuButtonClick = function () {};
	  $scope.setMenuButton = function (icon, fn) {
	    $scope.menuButtonIcon = icon;
	    $scope.menuButtonClick = fn;
	  };
	  $scope.menuRightButtonIcon = '';
	  $scope.menuRightButtonClick = function () {
	    $scope.$broadcast('RightButtonClick', 'click');
	  };
	  $scope.setMenuRightButton = function (icon) {
	    $scope.menuRightButtonIcon = icon;
	  };
	  $scope.$on('$stateChangeStart', function (event, toUrl, fromUrl) {
	    $scope.fabButton = false;
	    $scope.title = '';
	    $scope.menuButtonIcon = '';
	    $scope.menuRightButtonIcon = '';
	  });
	}]).controller('AdminIndexController', ['$scope', 'adminApi', function ($scope, adminApi) {
	  $scope.setTitle('首页');
	  adminApi.getIndexInfo().then(function (success) {
	    $scope.signupUsers = success.signup;
	    $scope.loginUsers = success.login;
	  });
	}]).controller('AdminPayController', ['$scope', 'adminApi', function ($scope, adminApi) {
	  $scope.setTitle('续费');
	  adminApi.getOrder().then(function (orders) {
	    return $scope.orders = orders;
	  });
	}]);

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var app = __webpack_require__(1).app;

	app.controller('AdminAccountController', ['$scope', '$state', '$stateParams', '$http', 'accountSortDialog', '$interval', '$sessionStorage', function ($scope, $state, $stateParams, $http, accountSortDialog, $interval, $sessionStorage) {
	  $scope.setTitle('账号');
	  $scope.setMenuRightButton('sort_by_alpha');
	  $scope.accountInfo = {};
	  $scope.sortAndFilter = function () {
	    $scope.accountInfo.account = $scope.accountInfo.originalAccount.sort(function (a, b) {
	      if ($scope.accountMethod.sort === 'port') {
	        return a.port >= b.port ? 1 : -1;
	      } else if ($scope.accountMethod.sort === 'expire') {
	        if (!a.data || !b.data) {
	          return 1;
	        }
	        return a.data.expire >= b.data.expire ? 1 : -1;
	      }
	    });
	    $scope.accountInfo.account = $scope.accountInfo.account.filter(function (f) {
	      var show = true;
	      if (!$scope.accountMethod.filter.expired && f.data && f.data.expire >= Date.now()) {
	        show = false;
	      }
	      if (!$scope.accountMethod.filter.unexpired && f.data && f.data.expire <= Date.now()) {
	        show = false;
	      }
	      return show;
	    });
	  };
	  var getAccount = function getAccount() {
	    $http.get('/api/admin/account').then(function (success) {
	      $scope.accountInfo.originalAccount = success.data;
	      $scope.accountInfo.account = angular.copy($scope.accountInfo.originalAccount);
	      $scope.sortAndFilter();
	    });
	  };
	  getAccount();
	  $scope.accountMethod = $sessionStorage.settings.accountFilter ? $sessionStorage.settings.accountFilter : {
	    sort: 'port',
	    filter: {
	      expired: true,
	      unexpired: true
	    }
	  };
	  $scope.setFabButton(function () {
	    $state.go('admin.addAccount');
	  });
	  $scope.toAccount = function (id) {
	    $state.go('admin.accountPage', { accountId: id });
	  };
	  $scope.sortAndFilterDialog = function () {
	    accountSortDialog.show($scope.accountMethod, $scope.accountInfo);
	  };
	  $scope.$on('RightButtonClick', function () {
	    $scope.sortAndFilterDialog();
	  });
	}]).controller('AdminAccountPageController', ['$scope', '$state', '$stateParams', '$http', '$mdMedia', '$q', function ($scope, $state, $stateParams, $http, $mdMedia, $q) {
	  $scope.setTitle('账号');
	  $scope.setMenuButton('arrow_back', function () {
	    $state.go('admin.account');
	  });
	  $q.all([$http.get('/api/admin/account/' + $stateParams.accountId), $http.get('/api/admin/server')]).then(function (success) {
	    $scope.account = success[0].data;
	    $scope.servers = success[1].data;
	  });
	  $scope.getServerPortData = function (serverId, port) {
	    $scope.serverPortFlow = 0;
	    $scope.lastConnect = 0;
	    $http.get('/api/admin/flow/' + serverId + '/' + port).then(function (success) {
	      $scope.serverPortFlow = success.data[0];
	    });
	    $http.get('/api/admin/flow/' + serverId + '/' + port + '/lastConnect').then(function (success) {
	      $scope.lastConnect = success.data.lastConnect;
	    });
	    $scope.getChartData(serverId);
	  };
	  var base64Encode = function base64Encode(str) {
	    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
	      return String.fromCharCode('0x' + p1);
	    }));
	  };
	  $scope.createQrCode = function (method, password, host, port) {
	    return 'ss://' + base64Encode(method + ':' + password + '@' + host + ':' + port);
	  };
	  $scope.editAccount = function (id) {
	    $state.go('admin.editAccount', { accountId: id });
	  };

	  $scope.getQrCodeSize = function () {
	    if ($mdMedia('xs')) {
	      return 230;
	    } else if ($mdMedia('lg')) {
	      return 240;
	    }
	    return 180;
	  };

	  $scope.flowType = {
	    value: 'day'
	  };
	  var flowTime = {
	    hour: Date.now(),
	    day: Date.now(),
	    week: Date.now()
	  };
	  var flowLabel = {
	    hour: ['0', '', '', '15', '', '', '30', '', '', '45', '', ''],
	    day: ['0', '', '', '', '', '', '6', '', '', '', '', '', '12', '', '', '', '', '', '18', '', '', '', '', ''],
	    week: ['S', 'M', 'T', 'W', 'T', 'F', 'S']
	  };
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
	  var setChart = function setChart(lineData, pieData) {
	    $scope.pieChart = {
	      data: pieData.map(function (m) {
	        return m.flow;
	      }),
	      labels: pieData.map(function (m) {
	        return m.name;
	      }),
	      options: {
	        responsive: false,
	        tooltips: {
	          enabled: true,
	          mode: 'single',
	          callbacks: {
	            label: function label(tooltipItem, data) {
	              var label = data.labels[tooltipItem.index];
	              var datasetLabel = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
	              return label + ': ' + scaleLabel(datasetLabel);
	            }
	          }
	        }
	      }
	    };
	    $scope.lineChart = {
	      data: [lineData],
	      labels: flowLabel[$scope.flowType.value],
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
	  };
	  $scope.getChartData = function (serverId) {
	    $q.all([$http.get('/api/admin/flow/' + serverId, {
	      params: {
	        port: $scope.account.port,
	        type: $scope.flowType.value,
	        time: new Date(flowTime[$scope.flowType.value])
	      }
	    }), $http.get('/api/admin/flow/account/' + $stateParams.accountId, {
	      params: {
	        port: $scope.account.port,
	        type: $scope.flowType.value,
	        time: new Date(flowTime[$scope.flowType.value])
	      }
	    })]).then(function (success) {
	      $scope.sumFlow = success[0].data.reduce(function (a, b) {
	        return a + b;
	      }, 0);
	      setChart(success[0].data, success[1].data);
	    });
	    if ($scope.flowType.value === 'hour') {
	      $scope.time = moment(flowTime[$scope.flowType.value]).format('YYYY-MM-DD HH:00');
	    }
	    if ($scope.flowType.value === 'day') {
	      $scope.time = moment(flowTime[$scope.flowType.value]).format('YYYY-MM-DD');
	    }
	    if ($scope.flowType.value === 'week') {
	      $scope.time = moment(flowTime[$scope.flowType.value]).day(0).format('YYYY-MM-DD') + ' / ' + moment(flowTime[$scope.flowType.value]).day(6).format('YYYY-MM-DD');
	    }
	  };
	  $scope.changeFlowTime = function (serverId, number) {
	    var time = {
	      hour: 3600 * 1000,
	      day: 24 * 3600 * 1000,
	      week: 7 * 24 * 3600 * 1000
	    };
	    flowTime[$scope.flowType.value] += number * time[$scope.flowType.value];
	    $scope.getChartData(serverId);
	  };
	}]).controller('AdminAddAccountController', ['$scope', '$state', '$stateParams', '$http', '$mdBottomSheet', function ($scope, $state, $stateParams, $http, $mdBottomSheet) {
	  $scope.setTitle('添加账号');
	  $scope.setMenuButton('arrow_back', function () {
	    $state.go('admin.account');
	  });
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
	      templateUrl: '/public/views/admin/pickTime.html',
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
	  $scope.setTitle('编辑账号');
	  $scope.setMenuButton('arrow_back', function () {
	    $state.go('admin.accountPage', { accountId: $stateParams.accountId });
	  });
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
	    $state.go('admin.accountPage', { accountId: $stateParams.accountId });
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
	      $state.go('admin.accountPage', { accountId: $stateParams.accountId });
	    });
	  };
	  $scope.pickTime = function () {
	    $mdBottomSheet.show({
	      templateUrl: '/public/views/admin/pickTime.html',
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
	}]);

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var app = __webpack_require__(1).app;

	app.controller('AdminServerController', ['$scope', '$http', '$state', 'moment', function ($scope, $http, $state, moment) {
	  $scope.setTitle('服务器');
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
	}]).controller('AdminServerPageController', ['$scope', '$state', '$stateParams', '$http', 'moment', '$mdDialog', 'adminApi', '$q', function ($scope, $state, $stateParams, $http, moment, $mdDialog, adminApi, $q) {
	  $scope.setTitle('服务器');
	  $scope.setMenuButton('arrow_back', function () {
	    $state.go('admin.server');
	  });
	  $http.get('/api/admin/server/' + $stateParams.serverId).then(function (success) {
	    $scope.server = success.data;
	  }).catch(function () {
	    $state.go('admin.server');
	  });
	  $scope.toAccountPage = function (port) {
	    adminApi.getAccountId(port).then(function (id) {
	      $state.go('admin.accountPage', { accountId: id });
	    });
	  };
	  $scope.editServer = function (id) {
	    $state.go('admin.editServer', { serverId: id });
	  };
	  $scope.deleteServer = function (id) {
	    var confirm = $mdDialog.confirm().title('').textContent('删除服务器？').ariaLabel('deleteServer').ok('确认').cancel('取消');
	    $mdDialog.show(confirm).then(function () {
	      return $http.delete('/api/admin/server/' + $stateParams.serverId);
	    }).then(function () {
	      $state.go('admin.server');
	    }).catch(function () {});
	  };

	  $scope.flowType = 'day';
	  var flowTime = {
	    hour: Date.now(),
	    day: Date.now(),
	    week: Date.now()
	  };
	  var flowLabel = {
	    hour: ['0', '', '', '15', '', '', '30', '', '', '45', '', ''],
	    day: ['0', '', '', '', '', '', '6', '', '', '', '', '', '12', '', '', '', '', '', '18', '', '', '', '', ''],
	    week: ['S', 'M', 'T', 'W', 'T', 'F', 'S']
	  };
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
	  var setChart = function setChart(lineData, pieData) {
	    $scope.pieChart = {
	      data: pieData.map(function (m) {
	        return m.flow;
	      }),
	      labels: pieData.map(function (m) {
	        return m.port + (m.username ? ' [' + m.username + ']' : '');
	      }),
	      options: {
	        // responsive: false,
	        tooltips: {
	          enabled: true,
	          mode: 'single',
	          callbacks: {
	            label: function label(tooltipItem, data) {
	              var label = data.labels[tooltipItem.index];
	              var datasetLabel = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
	              return label + ': ' + scaleLabel(datasetLabel);
	            }
	          }
	        }
	      }
	    };
	    $scope.lineChart = {
	      data: [lineData],
	      labels: flowLabel[$scope.flowType],
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
	  };
	  $scope.getChartData = function () {
	    $q.all([$http.get('/api/admin/flow/' + $stateParams.serverId, {
	      params: {
	        type: $scope.flowType,
	        time: new Date(flowTime[$scope.flowType])
	      }
	    }), $http.get('/api/admin/flow/' + $stateParams.serverId + '/user', {
	      params: {
	        type: $scope.flowType,
	        time: new Date(flowTime[$scope.flowType])
	      }
	    })]).then(function (success) {
	      $scope.sumFlow = success[0].data.reduce(function (a, b) {
	        return a + b;
	      }, 0);
	      setChart(success[0].data, success[1].data);
	    });
	    if ($scope.flowType === 'hour') {
	      $scope.time = moment(flowTime[$scope.flowType]).format('YYYY-MM-DD HH:00');
	    }
	    if ($scope.flowType === 'day') {
	      $scope.time = moment(flowTime[$scope.flowType]).format('YYYY-MM-DD');
	    }
	    if ($scope.flowType === 'week') {
	      $scope.time = moment(flowTime[$scope.flowType]).day(0).format('YYYY-MM-DD') + ' / ' + moment(flowTime[$scope.flowType]).day(6).format('YYYY-MM-DD');
	    }
	  };
	  $scope.getChartData();
	  $scope.changeFlowTime = function (number) {
	    var time = {
	      hour: 3600 * 1000,
	      day: 24 * 3600 * 1000,
	      week: 7 * 24 * 3600 * 1000
	    };
	    flowTime[$scope.flowType] += number * time[$scope.flowType];
	    $scope.getChartData();
	  };
	}]).controller('AdminAddServerController', ['$scope', '$state', '$stateParams', '$http', function ($scope, $state, $stateParams, $http) {
	  $scope.setTitle('新增服务器');
	  $scope.setMenuButton('arrow_back', function () {
	    $state.go('admin.server');
	  });
	  $scope.methods = ['aes-256-cfb', 'aes-192-cfb'];
	  $scope.server = {
	    method: 'aes-256-cfb'
	  };
	  $scope.confirm = function () {
	    $http.post('/api/admin/server', {
	      name: $scope.server.name,
	      address: $scope.server.address,
	      port: +$scope.server.port,
	      password: $scope.server.password,
	      method: $scope.server.method || 'aes-256-cfb'
	    }).then(function (success) {
	      $state.go('admin.server');
	    });
	  };
	  $scope.cancel = function () {
	    $state.go('admin.server');
	  };
	}]).controller('AdminEditServerController', ['$scope', '$state', '$stateParams', '$http', function ($scope, $state, $stateParams, $http) {
	  $scope.setTitle('编辑服务器');
	  $scope.setMenuButton('arrow_back', function () {
	    $state.go('admin.serverPage', { serverId: $stateParams.serverId });
	  });
	  $scope.methods = ['aes-256-cfb', 'aes-192-cfb'];
	  $http.get('/api/admin/server/' + $stateParams.serverId).then(function (success) {
	    $scope.server = {
	      name: success.data.name,
	      address: success.data.host,
	      port: +success.data.port,
	      password: success.data.password,
	      method: success.data.method || 'aes-256-cfb'
	    };
	  });
	  $scope.confirm = function () {
	    $http.put('/api/admin/server/' + $stateParams.serverId, {
	      name: $scope.server.name,
	      address: $scope.server.address,
	      port: +$scope.server.port,
	      password: $scope.server.password,
	      method: $scope.server.method
	    }).then(function (success) {
	      $state.go('admin.serverPage', { serverId: $stateParams.serverId });
	    });
	  };
	  $scope.cancel = function () {
	    $state.go('admin.serverPage', { serverId: $stateParams.serverId });
	  };
	}]);

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var app = __webpack_require__(1).app;

	app.controller('AdminUserController', ['$scope', '$state', '$stateParams', 'adminApi', function ($scope, $state, $stateParams, adminApi) {
	  $scope.setTitle('用户');
	  // $http.get('/api/admin/user').then(success => {
	  //   $scope.users = success.data;
	  // });
	  adminApi.getUser().then(function (success) {
	    $scope.users = success;
	  });
	  $scope.toUser = function (id) {
	    $state.go('admin.userPage', { userId: id });
	  };
	}]).controller('AdminUserPageController', ['$scope', '$state', '$stateParams', '$http', '$mdDialog', function ($scope, $state, $stateParams, $http, $mdDialog) {
	  $scope.setTitle('用户信息');
	  $scope.setMenuButton('arrow_back', function () {
	    $state.go('admin.user');
	  });
	  var userId = $stateParams.userId;
	  var getUserData = function getUserData() {
	    $http.get('/api/admin/user/' + $stateParams.userId).then(function (success) {
	      $scope.user = success.data;
	    });
	    $http.get('/api/admin/user/account').then(function (success) {
	      $scope.account = success.data;
	    });
	  };
	  getUserData();
	  $scope.deleteUserAccount = function (accountId) {
	    $http.delete('/api/admin/user/' + userId + '/' + accountId).then(function (success) {
	      getUserData();
	    });
	  };
	  var openDialog = function openDialog() {
	    $scope.dialog = $mdDialog.show({
	      templateUrl: '/public/views/admin/pickAccount.html',
	      parent: angular.element(document.body),
	      clickOutsideToClose: true,
	      preserveScope: true,
	      scope: $scope
	    });
	  };
	  $scope.setFabButton(function () {
	    openDialog();
	  });
	  $scope.confirmAccount = function () {
	    $mdDialog.hide($scope.dialog);
	    var promise = [];
	    $scope.account.forEach(function (f) {
	      if (f.isChecked) {
	        promise.push($http.put('/api/admin/user/' + userId + '/' + f.id));
	      }
	    });
	    Promise.all(promise).then(function (success) {
	      getUserData();
	    });
	  };
	}]);

/***/ },
/* 9 */
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
	    controller: 'HomeIndexController',
	    templateUrl: '/public/views/home/index.html'
	  }).state('home.login', {
	    url: '/login',
	    controller: 'HomeLoginController',
	    templateUrl: '/public/views/home/login.html'
	  }).state('home.signup', {
	    url: '/signup',
	    controller: 'HomeSignupController',
	    templateUrl: '/public/views/home/signup.html'
	  }).state('home.resetPassword', {
	    url: '/password/reset/:token',
	    controller: 'HomeResetPasswordController',
	    templateUrl: '/public/views/home/resetPassword.html'
	  });
	}]);

	// app.service('authInterceptor', ['$q', function($q) {
	//   const service = this;
	//   service.responseError = function(response) {
	//     if (response.status == 401) {
	//       window.location = '/';
	//     }
	//     return $q.reject(response);
	//   };
	// }])
	// .config(['$httpProvider', $httpProvider => {
	//   $httpProvider.interceptors.push('authInterceptor');
	// }]);

/***/ },
/* 10 */
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
	  }).state('user.account', {
	    url: '/account',
	    controller: 'UserAccountController',
	    templateUrl: '/public/views/user/account.html'
	  });
	}]);

/***/ },
/* 11 */
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
	  }).state('admin.editServer', {
	    url: '/server/:serverId/edit',
	    controller: 'AdminEditServerController',
	    templateUrl: '/public/views/admin/editServer.html'
	  }).state('admin.user', {
	    url: '/user',
	    controller: 'AdminUserController',
	    templateUrl: '/public/views/admin/user.html'
	  }).state('admin.account', {
	    url: '/account',
	    controller: 'AdminAccountController',
	    templateUrl: '/public/views/admin/account.html'
	  }).state('admin.accountPage', {
	    url: '/account/:accountId',
	    controller: 'AdminAccountPageController',
	    templateUrl: '/public/views/admin/accountPage.html'
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
	  }).state('admin.pay', {
	    url: '/pay',
	    controller: 'AdminPayController',
	    templateUrl: '/public/views/admin/pay.html'
	  }).state('admin.unfinished', {
	    url: '/unfinished',
	    templateUrl: '/public/views/admin/unfinished.html'
	  });
	}]);

/***/ },
/* 12 */
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

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var app = __webpack_require__(1).app;

	app.filter('timeago', function () {
	  return function (input) {

	    var ret = '';
	    var retTail = '';

	    var time = Date.now() - new Date(input);
	    if (time < 0) {
	      time = -time;
	    } else {
	      retTail = '前';
	    }

	    var day = Math.trunc(time / (24 * 3600 * 1000));
	    var hour = Math.trunc(time % (24 * 3600 * 1000) / (3600 * 1000));
	    var minute = Math.trunc(time % (24 * 3600 * 1000) % (3600 * 1000) / (60 * 1000));
	    if (day) {
	      ret += day + '天';
	    }
	    if (day || hour) {
	      ret += hour + '小时';
	    }
	    if (!day && (hour || minute)) {
	      ret += minute + '分钟';
	    }
	    if (time < 60 * 1000) {
	      ret = '几秒';
	    }

	    return ret + retTail;
	  };
	});

	app.filter('timeagoshort', function () {
	  return function (input) {

	    var ret = '';
	    var retTail = '';

	    var time = Date.now() - new Date(input);
	    if (time < 0) {
	      time = -time;
	    } else {
	      retTail = '前';
	    }

	    var day = Math.trunc(time / (24 * 3600 * 1000));
	    var hour = Math.trunc(time % (24 * 3600 * 1000) / (3600 * 1000));
	    var minute = Math.trunc(time % (24 * 3600 * 1000) % (3600 * 1000) / (60 * 1000));
	    if (day) {
	      ret += day + '天';
	    } else if (hour) {
	      ret += hour + '小时';
	    } else if (minute) {
	      ret += minute + '分钟';
	    } else if (time < 60 * 1000) {
	      ret = '几秒';
	    }
	    return ret + retTail;
	  };
	});

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var app = __webpack_require__(1).app;

	app.filter('order', function () {
	  return function (status) {
	    var result = {
	      CREATE: '创建',
	      WAIT_BUYER_PAY: '等待',
	      TRADE_SUCCESS: '付款',
	      FINISH: '完成',
	      TRADE_CLOSED: '关闭'
	    };
	    return result[status] || '其它';
	  };
	});

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var app = __webpack_require__(1).app;

	app.factory('adminApi', ['$http', '$q', function ($http, $q) {
	  var getUser = function getUser() {
	    return $http.get('/api/admin/user').then(function (success) {
	      return success.data;
	    });
	  };
	  var getOrder = function getOrder() {
	    return $http.get('/api/admin/order').then(function (success) {
	      return success.data;
	    });
	  };
	  var getAccountId = function getAccountId(port) {
	    return $http.get('/api/admin/account/port/' + port).then(function (success) {
	      return success.data.id;
	    });
	  };
	  var getIndexInfo = function getIndexInfo() {
	    return $q.all([$http.get('/api/admin/user/recentSignUp').then(function (success) {
	      return success.data;
	    }), $http.get('/api/admin/user/recentLogin').then(function (success) {
	      return success.data;
	    })]).then(function (success) {
	      return {
	        signup: success[0],
	        login: success[1]
	      };
	    });
	  };
	  return {
	    getUser: getUser,
	    getOrder: getOrder,
	    getAccountId: getAccountId,
	    getIndexInfo: getIndexInfo
	  };
	}]);

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var app = __webpack_require__(1).app;

	app.factory('homeApi', ['$http', function ($http) {
	  var userSignup = function userSignup(email, code, password) {
	    return $http.post('/api/home/signup', {
	      email: email,
	      code: code,
	      password: password
	    }).catch(function (err) {
	      if (err.status === 403) {
	        return Promise.reject('用户注册失败');
	      } else {
	        return Promise.reject('网络异常，请稍后再试');
	      }
	    });
	  };
	  var userLogin = function userLogin(email, password) {
	    return $http.post('/api/home/login', {
	      email: email,
	      password: password
	    }).then(function (success) {
	      return success.data.type;
	    }).catch(function (err) {
	      if (err.status === 403) {
	        var errData = '用户名或密码错误';
	        if (err.data === 'user not exists') {
	          errData = '该用户尚未注册的';
	        }
	        if (err.data === 'invalid body') {
	          errData = '请输入正确的用户名格式';
	        }
	        if (err.data === 'password retry out of limit') {
	          errData = '密码重试次数已达上限\n请稍后再试';
	        }
	        return Promise.reject(errData);
	      } else {
	        return Promise.reject('网络异常，请稍后再试');
	      }
	    });
	  };
	  var findPassword = function findPassword(email) {
	    if (!email) {
	      return Promise.reject('请输入邮箱地址再点击“找回密码”');
	    };
	    return $http.post('/api/home/password/sendEmail', {
	      email: email
	    }).then(function (success) {
	      return '重置密码链接已发至您的邮箱，\n请注意查收';
	    }).catch(function (err) {
	      var errData = null;
	      if (err.status === 403 && err.data === 'already send') {
	        errData = '重置密码链接已经发送，\n请勿重复发送';
	      } else if (err.status === 403 && err.data === 'user not exists') {
	        errData = '请输入正确的邮箱地址';
	      } else {
	        errData = '网络异常，请稍后再试';
	      }
	      return Promise.reject(errData);
	    });
	  };

	  return {
	    userSignup: userSignup, userLogin: userLogin, findPassword: findPassword
	  };
	}]);

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var app = __webpack_require__(1).app;

	app.factory('userApi', ['$q', '$http', function ($q, $http) {
	  var getUserAccount = function getUserAccount() {
	    var account = null;
	    var servers = null;
	    return $q.all([$http.get('/api/user/account'), $http.get('/api/user/server')]).then(function (success) {
	      return {
	        account: success[0].data,
	        servers: success[1].data
	      };
	    });
	  };
	  var changePassword = function changePassword(accountId, password) {
	    return $http.put('/api/user/' + accountId + '/password', {
	      password: password
	    });
	  };
	  return {
	    getUserAccount: getUserAccount,
	    changePassword: changePassword
	  };
	}]);

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var app = __webpack_require__(1).app;

	app.factory('alertDialog', ['$mdDialog', function ($mdDialog) {
	  var publicInfo = {};
	  publicInfo.isLoading = false;
	  publicInfo.content = '';
	  publicInfo.button = '';
	  var close = function close() {
	    return $mdDialog.hide().then(function (success) {
	      publicInfo.isLoading = false;
	      alertDialogPromise = null;
	      return;
	    }).catch(function (err) {
	      publicInfo.isLoading = false;
	      alertDialogPromise = null;
	      return;
	    });
	  };
	  publicInfo.close = close;
	  var alertDialogPromise = null;
	  var isDialogShow = function isDialogShow() {
	    if (alertDialogPromise && !alertDialogPromise.$$state.status) {
	      return true;
	    }
	    return false;
	  };
	  var dialog = {
	    templateUrl: '/public/views/home/alertDialog.html',
	    escapeToClose: false,
	    locals: { bind: publicInfo },
	    bindToController: true,
	    controller: ['$scope', '$mdDialog', 'bind', function ($scope, $mdDialog, bind) {
	      $scope.publicInfo = bind;
	    }],
	    clickOutsideToClose: false
	  };
	  var show = function show(content, button) {
	    publicInfo.content = content;
	    publicInfo.button = button;
	    if (isDialogShow()) {
	      publicInfo.isLoading = false;
	      return alertDialogPromise;
	    }
	    alertDialogPromise = $mdDialog.show(dialog);
	    return alertDialogPromise;
	  };
	  var loading = function loading() {
	    publicInfo.isLoading = true;
	    if (!isDialogShow()) {
	      show();
	    }
	  };
	  return {
	    show: show,
	    loading: loading,
	    close: close
	  };
	}]);

	app.factory('payDialog', ['$mdDialog', '$interval', '$http', function ($mdDialog, $interval, $http) {
	  var publicInfo = {};
	  publicInfo.isLoading = false;
	  publicInfo.qrCode = '';
	  var interval = null;
	  var close = function close() {
	    interval && $interval.cancel(interval);
	    return $mdDialog.hide().then(function (success) {
	      publicInfo.isLoading = false;
	      payDialogPromise = null;
	      return;
	    }).catch(function (err) {
	      publicInfo.isLoading = false;
	      payDialogPromise = null;
	      return;
	    });
	  };
	  publicInfo.close = close;
	  var payDialogPromise = null;
	  var isDialogShow = function isDialogShow() {
	    if (payDialogPromise && !payDialogPromise.$$state.status) {
	      return true;
	    }
	    return false;
	  };
	  var dialog = {
	    templateUrl: '/public/views/user/payDialog.html',
	    escapeToClose: false,
	    locals: { bind: publicInfo },
	    bindToController: true,
	    controller: ['$scope', '$mdDialog', '$mdMedia', 'bind', function ($scope, $mdDialog, $mdMedia, bind) {
	      $scope.getQrCodeSize = function () {
	        if ($mdMedia('xs') || $mdMedia('sm')) {
	          return 200;
	        }
	        return 250;
	      };
	      $scope.publicInfo = bind;
	      $scope.qrCode = function () {
	        return $scope.publicInfo.qrCode || 'AAA';
	      };
	      $scope.pay = function () {
	        window.location.href = $scope.publicInfo.qrCode;
	      };
	    }],
	    clickOutsideToClose: false
	  };
	  var setUrl = function setUrl(orderId, url) {
	    if (orderId && url) {
	      interval = $interval(function () {
	        $http.post('/api/user/order/status', {
	          orderId: orderId
	        }).then(function (success) {
	          var orderStatus = success.data.status;
	          if (orderStatus === 'TRADE_SUCCESS' || orderStatus === 'FINISH') {
	            close();
	          }
	        });
	      }, 5 * 1000);
	    }
	    publicInfo.qrCode = url;
	    if (isDialogShow()) {
	      publicInfo.isLoading = false;
	      return payDialogPromise;
	    }
	    payDialogPromise = $mdDialog.show(dialog);
	    return payDialogPromise;
	  };
	  var loading = function loading() {
	    publicInfo.isLoading = true;
	    if (!isDialogShow()) {
	      setUrl();
	    }
	  };
	  return {
	    setUrl: setUrl,
	    loading: loading,
	    close: close
	  };
	}]);

	app.factory('accountSortDialog', ['$mdDialog', function ($mdDialog) {
	  var publicInfo = {};
	  var hide = function hide() {
	    return $mdDialog.hide().then(function (success) {
	      dialogPromise = null;
	      return;
	    }).catch(function (err) {
	      dialogPromise = null;
	      return;
	    });
	  };
	  publicInfo.hide = hide;
	  var dialogPromise = null;
	  var isDialogShow = function isDialogShow() {
	    if (dialogPromise && !dialogPromise.$$state.status) {
	      return true;
	    }
	    return false;
	  };
	  var dialog = {
	    templateUrl: '/public/views/admin/accountSortAndFilterDialog.html',
	    escapeToClose: false,
	    locals: { bind: publicInfo },
	    bindToController: true,
	    controller: ['$scope', '$mdDialog', '$sessionStorage', 'bind', function ($scope, $mdDialog, $sessionStorage, bind) {
	      $scope.publicInfo = bind;
	      $scope.sortAndFilter = function () {
	        $sessionStorage.settings.accountFilter = $scope.publicInfo.accountMethod;
	        $scope.publicInfo.accountInfo.account = $scope.publicInfo.accountInfo.originalAccount.sort(function (a, b) {
	          if ($scope.publicInfo.accountMethod.sort === 'port') {
	            return a.port >= b.port ? 1 : -1;
	          } else if ($scope.publicInfo.accountMethod.sort === 'expire') {
	            if (!a.data || !b.data) {
	              return 1;
	            }
	            return a.data.expire >= b.data.expire ? 1 : -1;
	          }
	        });
	        $scope.publicInfo.accountInfo.account = $scope.publicInfo.accountInfo.account.filter(function (f) {
	          var show = true;
	          if (!$scope.publicInfo.accountMethod.filter.expired && f.data && f.data.expire >= Date.now()) {
	            show = false;
	          }
	          if (!$scope.publicInfo.accountMethod.filter.unexpired && f.data && f.data.expire <= Date.now()) {
	            show = false;
	          }
	          return show;
	        });
	      };
	    }],
	    clickOutsideToClose: true
	  };
	  var show = function show(accountMethod, accountInfo) {
	    if (isDialogShow()) {
	      return dialogPromise;
	    }
	    publicInfo.accountMethod = accountMethod;
	    publicInfo.accountInfo = accountInfo;
	    dialogPromise = $mdDialog.show(dialog);
	    return dialogPromise;
	  };
	  return {
	    show: show,
	    hide: hide
	  };
	}]);

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var app = __webpack_require__(1).app;
	app.factory('ws', ['$websocket', '$location', '$timeout', function ($websocket, $location, $timeout) {
	  var protocol = $location.protocol() === 'http' ? 'ws://' : 'wss://';
	  var url = protocol + $location.host() + ':' + $location.port() + '/user';
	  var connection = null;
	  var messages = [];
	  var connect = function connect() {
	    connection = $websocket(url);
	    connection.onMessage(function (message) {
	      console.log(message.data);
	      messages.push(message.data);
	    });
	    connection.onClose(function () {
	      $timeout(function () {
	        connect();
	      }, 3000);
	    });
	  };
	  connect();
	  var methods = {
	    messages: messages,
	    send: function send(msg) {
	      connection.send(msg);
	    }
	  };
	  return methods;
	}]);

/***/ }
/******/ ]);