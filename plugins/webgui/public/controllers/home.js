const app = require('../index').app;

app.controller('HomeController', ['$scope',
  ($scope) => {
    console.log('Home');
  }
]).controller('LoginController', ['$scope',
  ($scope) => {
    console.log('Login');
  }
]);
