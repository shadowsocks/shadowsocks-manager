const app = require('../index').app;

app.controller('HomeController', ['$scope',
  ($scope) => {
    console.log('Home');
  }
]).controller('IndexController', ['$scope',
  ($scope) => {
    console.log('Index');
  }
]).controller('LoginController', ['$scope',
  ($scope) => {
    console.log('Login');
  }
]);
