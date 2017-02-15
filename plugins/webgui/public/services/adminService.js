const app = require('../index').app;

app.factory('adminApi', ['$http', $http => {
  const getUser = () => {
    return $http.get('/api/admin/user').then(success => success.data);
  };
  const getOrder = () => {
    return $http.get('/api/admin/order').then(success => success.data);
  };
  return {
    getUser,
    getOrder,
  };
}]);
