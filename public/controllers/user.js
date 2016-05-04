app.controller('UserIndexController', function($scope, $http, $state) {
    $scope.logout = function() {
        $http.post('/user/logout');
    };
});