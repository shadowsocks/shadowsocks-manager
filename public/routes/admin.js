var app = angular.module('AdminApp', ['ngMaterial', 'ui.router', 'ngMessages']);

app.config(
    ['$stateProvider', '$urlRouterProvider',
        function($stateProvider, $urlRouterProvider) {

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
                .state('admin.serverAccount', {
                    url: '/serverAccount/:serverName',
                    controller: 'AdminServerAccountController',
                    templateUrl: '/public/views/admin/serverAccount.html'
                })
                .state('admin.addAccount', {
                    url: '/serverAccount/:serverName/addAccount',
                    controller: 'AdminAddAccountController',
                    templateUrl: '/public/views/admin/addAccount.html'
                })


                .state('admin.flow', {
                    url: '/flow',
                    controller: 'AdminFlowController',
                    templateUrl: '/public/views/admin/flow.html'
                })
            ;
        }
    ]
);