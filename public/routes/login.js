var app = angular.module('LoginApp', ['ngMaterial', 'ui.router', 'ngMessages']);

app.config(
    ['$stateProvider', '$urlRouterProvider',
        function($stateProvider, $urlRouterProvider) {

            $urlRouterProvider
                .when('/', '/index/login')
                .otherwise('/index/login');

            $stateProvider
                .state('index', {
                    abstract: true,
                    url: '/index',
                    templateUrl: '/public/views/index.html',
                })

                .state('index.login', {
                    url: '/login',
                    controller: 'LoginController',
                    templateUrl: '/public/views/login.html'
                })
                .state('index.signupSuccess', {
                    url: '/signupSuccess',
                    controller: 'SignupSuccessController',
                    templateUrl: '/public/views/signupSuccess.html'
                })
                // .state('index.tab2', {
                //     url: '/tab2',
                //     controller: function($scope) {

                //     },
                //     templateUrl: '/public/views/tab2.html'
                // })
            ;
        }
    ]
);