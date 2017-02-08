const app = require('../index').app;

app.controller('MainController', ['$scope',
  ($scope) => {
    $scope.mainLoading = true;
    $scope.setMainLoading = status => {
      $scope.mainLoading = status;
    };
  }
]);
