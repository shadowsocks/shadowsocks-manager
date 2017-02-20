const app = require('../index').app;

app.factory('adminApi', ['$http', '$q', ($http, $q) => {
  const getUser = () => {
    return $http.get('/api/admin/user').then(success => success.data);
  };
  const getOrder = () => {
    return $http.get('/api/admin/order').then(success => success.data);
  };
  const getAccountId = port => {
    return $http.get('/api/admin/account/port/' + port).then(success => success.data.id);
  };
  const getIndexInfo = () => {
    return $q.all([
      $http.get('/api/admin/user/recentSignUp').then(success => success.data),
      $http.get('/api/admin/user/recentLogin').then(success => success.data),
    ]).then(success => {
      return {
        signup: success[0],
        login: success[1],
      };
    });
  };
  const getServerPortData = (serverId, port) => {
    const Promises = [
      $http.get(`/api/admin/flow/${ serverId }/${ port }/lastConnect`),
      $http.get(`/api/admin/flow/${ serverId }/${ port }`),
    ];
    return $q.all(Promises).then(success => {
      return {
        lastConnect: success[0].data.lastConnect,
        flow: success[1].data[0],
      };
    });
  };
  return {
    getUser,
    getOrder,
    getAccountId,
    getIndexInfo,
    getServerPortData,
  };
}]);
