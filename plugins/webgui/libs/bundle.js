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

	app.controller('HomeController', ['$scope', function ($scope) {
	  console.log('Home');
	}]).controller('IndexController', ['$scope', function ($scope) {
	  console.log('Index');
	}]).controller('LoginController', ['$scope', function ($scope) {
	  console.log('Login');
	}]);

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var app = __webpack_require__(1).app;

	app.controller('MainController', ['$scope', function ($scope) {
	    console.log('Main');
	    $scope.innerSideNav = true;
	    $scope.menuButton = function () {
	        if (!$scope.publicInfo.menuButtonState) {
	            if ($mdMedia('gt-sm')) {
	                $scope.innerSideNav = !$scope.innerSideNav;
	            } else {
	                $mdSidenav('left').toggle();
	            }
	        } else if (!$scope.publicInfo.menuButtonHistoryBackState) {
	            $state.go($scope.publicInfo.menuButtonState, $scope.publicInfo.menuButtonStateParams);
	        } else {
	            $state.go($scope.publicInfo.menuButtonHistoryBackState, $scope.publicInfo.menuButtonHistoryBackStateParams);
	        }
	    };
	    $scope.menus = [{ name: '首页', icon: 'home', click: 'admin.index' }, { name: '服务器管理', icon: 'cloud', click: 'admin.server' }, { name: '用户管理', icon: 'face', click: 'admin.user' }, { name: '续费码', icon: 'shop', click: 'admin.renew' }, { name: '流量统计', icon: 'timeline', click: 'admin.flow.server' }, { name: '系统设置', icon: 'settings', click: 'admin.options' }];
	}]);

/***/ },
/* 4 */
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
	  });
	}]);

/***/ },
/* 5 */
/***/ function(module, exports) {

	"use strict";

/***/ },
/* 6 */
/***/ function(module, exports) {

	"use strict";

/***/ }
/******/ ]);