const app = require('../index').app;

app.factory('userApi', ['$http', $http => {
  const getUserAccount = () => {
    let account = null;
    let servers = null;
    return $http.get('/api/user/account').then(success => {
      account = success.data;
      return $http.get('/api/user/server');
    }).then(success => {
      servers = success.data;
      return {
        account, servers,
      };
    });
  };
  return {
    getUserAccount,
  };
}]);
