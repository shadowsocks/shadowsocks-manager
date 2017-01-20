const app = require('../index').app;

app.factory('userApi', ['$q', '$http', ($q, $http) => {
  const getUserAccount = () => {
    let account = null;
    let servers = null;
    return $q.all([
      $http.get('/api/user/account'),
      $http.get('/api/user/server'),
    ]).then(success => {
      return {
        account: success[0].data,
        servers: success[1].data,
      };
    });
  };
  return {
    getUserAccount,
  };
}]);
