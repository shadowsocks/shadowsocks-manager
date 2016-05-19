var app = angular.module('UserApp', ['ngMaterial', 'ui.router', 'ngMessages', 'ja.qr']);

app.config(
    ['$stateProvider', '$urlRouterProvider',
        function($stateProvider, $urlRouterProvider) {

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

            ;
        }
    ]
);