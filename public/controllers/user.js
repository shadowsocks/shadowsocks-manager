app.controller('UserIndexController', function($scope, $http, $state) {
        $scope.setTitle('首页');
        $scope.logout = function() {
            $http.post('/user/logout');
        };
    })
    .controller('UserAccountController', function($scope, $http, $state) {
        $scope.setTitle('我的帐户');
        $scope.string = 'YOUR TEXT TO ENCODE';
    })
    .controller('UserAccountPageController', function($scope, $http, $state) {
        $scope.setTitle('');
    })
;