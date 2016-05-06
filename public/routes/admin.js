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

            ;
        }
    ]
);