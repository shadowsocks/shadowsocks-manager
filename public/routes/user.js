var app = angular.module('UserApp', ['ngMaterial', 'ui.router', 'ngMessages', 'ja.qr', 'chart.js']);

app.config(
    ['$stateProvider', '$urlRouterProvider', '$locationProvider',
        function($stateProvider, $urlRouterProvider, $locationProvider) {
            $locationProvider.html5Mode(true);
            $urlRouterProvider
                .when('/', '/user/index')
                .otherwise('/user/index');

            $stateProvider
                .state('user', {
                    abstract: true,
                    url: '/user',
                    templateUrl: '/public/views/user/user.html',
                })

                .state('user.index', {
                    url: '/index',
                    controller: 'UserIndexController',
                    templateUrl: '/public/views/user/index.html'
                })
                .state('user.account', {
                    url: '/account',
                    controller: 'UserAccountController',
                    templateUrl: '/public/views/user/account.html'
                })
                .state('user.accountPage', {
                    url: '/account/:serverName/:accountPort',
                    controller: 'UserAccountPageController',
                    templateUrl: '/public/views/user/accountPage.html'
                })
                .state('user.changePassword', {
                    url: '/changePassword',
                    controller: 'UserChangePasswordController',
                    templateUrl: '/public/views/user/changePassword.html'
                })
                .state('user.changeShadowsocksPassword', {
                    url: '/changeShadowsocksPassword',
                    controller: 'UserChangeShadowsocksPasswordController',
                    templateUrl: '/public/views/user/changeShadowsocksPassword.html'
                })
                .state('user.renew', {
                    url: '/renew',
                    controller: 'UserRenewController',
                    templateUrl: '/public/views/user/renew.html'
                })
                .state('user.flow', {
                    url: '/flow',
                    controller: 'UserFlowController',
                    templateUrl: '/public/views/user/flow.html'
                })

                .state('user.unfinish', {
                    url: '/unfinish',
                    controller: 'UserUnfinishController',
                    templateUrl: '/public/views/user/unfinish.html'
                })
            ;
        }
    ]
);
