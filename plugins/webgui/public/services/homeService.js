const app = require('../index').app;

app.factory('HomeApi', ['$http', $http => {
  const userLogin = (email, password) => {
    return $http.post('/api/home/login', {
      email,
      password,
    }).then(success => {
      return success.data.type;
    }).catch(err => {
      if(err.status === 403) {
        return Promise.reject('用户名或密码错误');
      } else {
        return Promise.reject('网络异常，请稍后再试');
      }
    });
  };
  return {
    userLogin,
  };
}]);
