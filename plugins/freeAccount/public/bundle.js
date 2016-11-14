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

/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';

	exports.app = angular.module('app', ['ngMaterial', 'ui.router', 'ngMessages', 'ja.qr']);

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var app = __webpack_require__(1).app;

	app.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', function ($stateProvider, $urlRouterProvider, $locationProvider) {
	  $locationProvider.html5Mode(true);
	  $urlRouterProvider.when('', '/').otherwise('/');
	  $stateProvider.state('index', {
	    url: '/',
	    controller: 'IndexController',
	    templateUrl: '/public/views/index.html'
	  }).state('account', {
	    url: '/{id:[0-9a-f]{32}}',
	    controller: 'AccountController',
	    templateUrl: '/public/views/account.html'
	  }).state('password', {
	    url: '/password',
	    controller: 'PasswordController',
	    templateUrl: '/public/views/password.html'
	  }).state('manager', {
	    url: '/manager',
	    controller: 'ManagerController',
	    templateUrl: '/public/views/manager.html'
	  }).state('about', {
	    url: '/about',
	    controller: 'AboutController',
	    templateUrl: '/public/views/about.html'
	  }).state('user', {
	    url: '/user',
	    controller: 'UserController',
	    templateUrl: '/public/views/user.html'
	  });
	}]);

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var app = __webpack_require__(1).app;

	app.filter('flow1024', function () {
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
	}).filter('relativeTime', function () {
	  function relativeTime(input) {
	    var ret = '';
	    var retTail = '';

	    var time = +new Date() - new Date(input);
	    if (time < 0) {
	      time = -time;
	    } else retTail = '前';

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
	  relativeTime.$stateful = true;
	  return relativeTime;
	});
	app.controller('MainController', function ($scope, $http, $state, $mdDialog, $interval) {
	  $scope.interval = null;
	  $scope.setInterval = function (interval) {
	    $scope.interval = interval;
	  };
	  $scope.showAlert = function (title, text) {
	    $mdDialog.show($mdDialog.alert().parent(angular.element(document.querySelector('#popupContainer'))).clickOutsideToClose(true).title(title).textContent(text).ariaLabel('alert').ok('确定'));
	  };
	  $scope.isLoading = false;
	  $scope.loading = function (isLoading) {
	    $scope.isLoading = isLoading;
	  };
	  $scope.back = function () {
	    $state.go('index');
	  };
	  $scope.title = '';
	  $scope.setTitle = function (title) {
	    $scope.title = title;
	  };
	  $scope.setBackButton = function (fn) {
	    $scope.back = fn;
	  };
	  $scope.menus = [];
	  $scope.setMenu = function (menus) {
	    $scope.menus = menus;
	  };
	  $scope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
	    if ($scope.interval) {
	      $interval.cancel($scope.interval);
	    }
	    $scope.title = '';
	    $scope.back = function () {
	      $state.go('index');
	    };
	    $scope.menus = [];
	  });
	}).controller('IndexController', function ($scope, $http, $state, $timeout) {
	  $scope.setTitle('Free Shadowsocks');
	  var menu = function menu() {
	    $scope.setMenu([{
	      icon: 'settings',
	      text: '管理',
	      click: function click() {
	        $http.post('/config').then(function () {
	          $state.go('manager');
	        }).catch(function () {
	          $state.go('password');
	        });
	      }
	    }, {
	      icon: 'info_outline',
	      text: '关于',
	      click: function click() {
	        $state.go('about');
	      }
	    }]);
	  };
	  $timeout(function () {
	    menu();
	  }, 250);
	  $scope.user = {};
	  $scope.sendCode = function () {
	    $scope.loading(true);
	    $http.post('/email', {
	      email: $scope.user.email
	    }).then(function (success) {
	      $scope.loading(false);
	      $scope.showAlert('提示', '验证码发送成功。');
	    }).catch(function (error) {
	      $scope.loading(false);
	      $scope.showAlert('错误', '验证码发送失败。');
	    });
	  };
	  $scope.checkCode = function () {
	    $scope.loading(true);
	    $http.post('/code', {
	      email: $scope.user.email,
	      code: ('000000' + $scope.user.code).substr(-6)
	    }).then(function (success) {
	      // $scope.loading(false);
	      $state.go('account', {
	        id: success.data
	      });
	    }).catch(function (error) {
	      $scope.loading(false);
	      if (error.data.startsWith('out of limit, ')) {
	        var type = error.data.split(',')[1].split('.')[0].trim();
	        var time = error.data.split(',')[1].split('.')[1].trim();
	        if (type === 'user') {
	          if (time === 'day') {
	            return $scope.showAlert('错误', '该邮箱本日申请次数超过限额。');
	          }
	          if (time === 'week') {
	            return $scope.showAlert('错误', '该邮箱本周申请次数超过限额。');
	          }
	          if (time === 'month') {
	            return $scope.showAlert('错误', '该邮箱本月申请次数超过限额。');
	          }
	        }
	        if (type === 'global') {
	          if (time === 'day') {
	            return $scope.showAlert('错误', '本日免费帐号申请次数已达上限。');
	          }
	          if (time === 'week') {
	            return $scope.showAlert('错误', '本周免费帐号申请次数已达上限。');
	          }
	          if (time === 'month') {
	            return $scope.showAlert('错误', '本月免费帐号申请次数已达上限。');
	          }
	        }
	      }
	      $scope.showAlert('错误', '验证失败。');
	    });
	  };
	  $scope.emailKeypress = function (e) {
	    if (e.keyCode === 13 && $scope.user.email) {
	      $scope.sendCode();
	    }
	  };
	  $scope.codeKeypress = function (e) {
	    if (e.keyCode === 13 && $scope.user.code) {
	      $scope.checkCode();
	    }
	  };
	  $scope.manager = function () {
	    $http.post('/config').then(function () {
	      $state.go('manager');
	    }).catch(function () {
	      $state.go('password');
	    });
	  };
	  $scope.about = function () {
	    $state.go('about');
	  };
	}).controller('AccountController', function ($scope, $http, $state, $stateParams, $interval) {
	  $scope.qrcode = '';
	  var b64EncodeUnicode = function b64EncodeUnicode(str) {
	    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
	      return String.fromCharCode('0x' + p1);
	    }));
	  };
	  $scope.getAccount = function () {
	    $scope.qrcode || $scope.loading(true);
	    $http.post('/account', {
	      address: $stateParams.id
	    }).then(function (success) {
	      $scope.loading(false);
	      $scope.accountInfo = success.data;
	      $scope.qrcode = 'ss://' + b64EncodeUnicode($scope.accountInfo.method + ':' + $scope.accountInfo.password + '@' + $scope.accountInfo.host + ':' + $scope.accountInfo.port);
	    }, function (error) {
	      $scope.loading(false);
	      // interval && $interval.cancel(interval);
	      $state.go('index');
	    });
	  };
	  $scope.getAccount();
	  var interval = $interval(function () {
	    $scope.getAccount();
	  }, 60 * 1000);
	  $scope.setInterval(interval);
	}).controller('AboutController', function ($scope, $http, $state) {});

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var app = __webpack_require__(1).app;

	app.controller('PasswordController', function ($scope, $http, $state) {
	  $scope.setMenu([]);
	  $scope.user = {};
	  $scope.checkPassword = function () {
	    $scope.loading(true);
	    $http.post('/password', {
	      password: $scope.user.password
	    }).then(function () {
	      $state.go('manager');
	    }).catch(function () {
	      $scope.loading(false);
	      $scope.showAlert('错误', '管理员密码验证失败。');
	    });
	  };
	  $scope.passwordKeypress = function (e) {
	    if (e.keyCode === 13 && $scope.user.password) {
	      $scope.checkPassword();
	    }
	  };
	}).controller('ManagerController', function ($scope, $http, $state, $interval, $timeout) {
	  var menu = function menu() {
	    $scope.setMenu([{
	      icon: 'person',
	      text: '用户',
	      click: function click() {
	        $state.go('user');
	      }
	    }, {
	      icon: 'exit_to_app',
	      text: '退出',
	      click: function click() {
	        $http.post('/logout').then(function () {
	          // interval && $interval.cancel(interval);
	          $scope.setConfig();
	          $state.go('index');
	        });
	      }
	    }]);
	  };
	  $timeout(function () {
	    menu();
	  }, 250);
	  var oldConfig = '';
	  var newConfig = '';
	  $scope.config = {
	    shadowsocks: {
	      flow: 300,
	      time: 120
	    },
	    limit: {
	      user: { day: 0, week: 0, month: 0 },
	      global: { day: 0, week: 0, month: 0 }
	    }
	  };
	  $scope.getConfig = function () {
	    $scope.loading(true);
	    $http.post('/config').then(function (success) {
	      $scope.loading(false);
	      $scope.config = success.data;
	      oldConfig = JSON.stringify($scope.config);
	      newConfig = JSON.stringify($scope.config);
	    }).catch(function (error) {
	      $scope.loading(false);
	      if (error.status === 401) {
	        $state.go('password');
	      }
	    });
	  };
	  $scope.getConfig();
	  $scope.setBackButton(function () {
	    interval && $interval.cancel(interval);
	    $scope.setConfig();
	    $state.go('index');
	  });
	  $scope.setConfig = function () {
	    if (newConfig === oldConfig) {
	      return;
	    }
	    oldConfig = newConfig;
	    $http.put('/config', $scope.config);
	  };
	  var interval = $interval(function () {
	    if ($scope.isLoading) {
	      return;
	    }
	    newConfig = JSON.stringify($scope.config);
	    $scope.setConfig();
	  }, 1000);
	  $scope.setInterval(interval);
	}).controller('UserController', function ($scope, $http, $state, $timeout) {
	  var menu = function menu() {
	    $scope.setMenu([{
	      icon: 'build',
	      text: '配置',
	      click: function click() {
	        $state.go('manager');
	      }
	    }, {
	      icon: 'exit_to_app',
	      text: '退出',
	      click: function click() {
	        $http.post('/logout').then(function () {
	          $state.go('index');
	        });
	      }
	    }]);
	  };
	  $timeout(function () {
	    menu();
	  }, 250);
	  $scope.getUser = function () {
	    $scope.loading(true);
	    $http.post('/user').then(function (success) {
	      $scope.loading(false);
	      $scope.users = success.data;
	    }).catch(function (error) {
	      $scope.loading(false);
	      if (error.status === 401) {
	        $state.go('password');
	      }
	    });
	  };
	  $scope.getUser();
	  $scope.toAccount = function (address) {
	    $state.go('account', {
	      id: address
	    });
	  };
	});

/***/ }
/******/ ]);