var app = angular.module('UserApp', ['ngMaterial', 'ui.router', 'ngMessages']);

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

            ;
        }
    ]
);