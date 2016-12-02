const app = require('../index').app;

app.controller('MainController', ['$scope',
  ($scope) => {
    console.log('Main');
  }
]);
