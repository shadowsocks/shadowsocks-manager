app.controller('UserIndexController', function($scope, $http, $state) {
        $scope.logout = function() {
            $http.post('/user/logout');
        };
    })
    .controller('UserAccountController', function($scope, $http, $state) {
        
    })
;