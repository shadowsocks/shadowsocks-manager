var app = angular.module('AdminApp', ['ngMaterial', 'ui.router', 'ngMessages', 'ja.qr', 'chart.js']);

app.config(
    ['$stateProvider', '$urlRouterProvider', '$locationProvider',
        function($stateProvider, $urlRouterProvider, $locationProvider) {
            $locationProvider.html5Mode(true);
            $urlRouterProvider
                .when('/', '/admin/index')
                .otherwise('/admin/index');

            $stateProvider
                .state('admin', {
                    abstract: true,
                    url: '/admin',
                    templateUrl: '/public/views/admin/admin.html',
                })
                .state('admin.index', {
                    url: '/index',
                    controller: 'AdminIndexController',
                    templateUrl: '/public/views/admin/index.html'
                })

                .state('admin.server', {
                    url: '/server',
                    controller: 'AdminServerController',
                    templateUrl: '/public/views/admin/server.html'
                })
                .state('admin.addServer', {
                    url: '/addServer',
                    controller: 'AdminAddServerController',
                    templateUrl: '/public/views/admin/addServer.html'
                })
                .state('admin.editServer', {
                    url: '/editServer/:serverName',
                    controller: 'AdminEditServerController',
                    templateUrl: '/public/views/admin/addServer.html'
                })
                .state('admin.serverPage', {
                    url: '/serverPage/:serverName',
                    controller: 'AdminServerPageController',
                    templateUrl: '/public/views/admin/serverPage.html'
                })
                .state('admin.addAccount', {
                    url: '/serverPage/:serverName/addAccount',
                    controller: 'AdminAddAccountController',
                    templateUrl: '/public/views/admin/addAccount.html'
                })
                .state('admin.editAccount', {
                    url: '/serverPage/:serverName/editAccount/:accountPort',
                    controller: 'AdminEditAccountController',
                    templateUrl: '/public/views/admin/editAccount.html'
                })


                .state('admin.flow', {
                    url: '/flow',
                    abstract: true,
                    controller: 'AdminFlowController',
                    templateUrl: '/public/views/admin/flow.html'
                })
                .state('admin.flow.server', {
                    url: '/:serverName',
                    controller: 'AdminFlowServerController',
                    templateUrl: '/public/views/admin/flowServer.html'
                })

                .state('admin.user', {
                    url: '/user',
                    controller: 'AdminUserController',
                    templateUrl: '/public/views/admin/user.html'
                })
                .state('admin.userPage', {
                    url: '/user/:userName',
                    controller: 'AdminUserPageController',
                    templateUrl: '/public/views/admin/userPage.html'
                })
                .state('admin.userAddAccount', {
                    url: '/user/:userName/addAccount',
                    controller: 'AdminUserAddAccountController',
                    templateUrl: '/public/views/admin/userAddAccount.html'
                })
                .state('admin.unfinish', {
                    url: '/unfinish',
                    controller: 'AdminUnfinishController',
                    templateUrl: '/public/views/admin/unfinish.html'
                })


            ;
        }
    ]
);