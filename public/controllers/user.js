app.controller('UserIndexController', function($scope, $http, $state) {
    $scope.logout = function() {
        $http.post('/user/logout');
    };
})
.controller('TestCtrl', function($scope, $http, $state) {
    $scope.messages = [{what: '1awf', who: 'zgerf', notes: 'zgwergew'}];
})
;