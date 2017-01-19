const app = require('../index').app;

app.factory('homeApi', ['$http', $http => {
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
  const findPassword = email => {
    return $http.post('/api/home/password/sendEmail', {
      email,
    }).then(success => {
      return '重置密码链接已发至您的邮箱，\n请注意查收';
    }).catch(err => {
      let errData = null;
      if(err.status === 403 && err.data === 'already send') {
        errData = '重置密码链接已经发送，\n请勿重复发送';
      } else if(err.status === 403 && err.data === 'user not exists') {
        errData = '请输入正确的邮箱地址';
      } else {
        errData = '网络异常，请稍后再试';
      }
      return Promise.reject(errData);
    });
  };
  return {
    userLogin, findPassword,
  };
}]);
