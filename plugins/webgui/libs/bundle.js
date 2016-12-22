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

	app.controller('MainController', ['$scope', function ($scope) {
	  console.log('Main');
	}]);

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
	    name: '注册帐号',
	    icon: 'face',
	    click: 'home.signup'
	  }, {
	    name: '续费码',
	    icon: 'shop',
	    click: 'admin.renew'
	  }, {
	    name: '流量统计',
	    icon: 'timeline',
	    click: 'admin.flow.server'
	  }, {
	    name: '系统设置',
	    icon: 'settings',
	    click: 'admin.options'
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
	    click: 'admin.index'
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
	}]).controller('AdminIndexController', ['$scope', function ($scope) {
	  console.log('Index');
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
	  });
	}]);

/***/ }
/******/ ]);