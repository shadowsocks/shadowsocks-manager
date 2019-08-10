const app = angular.module('app');

app.factory('homeApi', ['$http', $http => {
  const userSignup = (email, code, password, ref) => {
    return $http.post('/api/home/signup', {
      email,
      code,
      password,
      ref,
    })
    .then(success => success.data)
    .catch(err => {
      if(err.status === 403) {
        let errData = '用户注册失败';
        if(err.data === 'user exists') { errData = '该用户已存在'; }
        return Promise.reject(errData);
      } else {
        return Promise.reject('网络异常，请稍后再试');
      }
    });
  };
  const userLogin = (email, password) => {
    return $http.post('/api/home/login', {
      email,
      password,
    }).then(success => {
      return success.data;
    }).catch(err => {
      if(err.status === 403) {
        let errData = '用户名或密码错误';
        if(err.data === 'user not exists') { errData = '该用户尚未注册'; }
        if(err.data === 'invalid body') { errData = '请输入正确的用户名格式'; }
        if(err.data === 'password retry out of limit') { errData = '密码重试次数已达上限\n请稍后再试'; }
        return Promise.reject(errData);
      } else {
        return Promise.reject('网络异常，请稍后再试');
      }
    });
  };
  const sendCode = (email, refCode) => {
    return $http.post('/api/home/code', {
      email,
      refCode,
    }).then(success => {
      return 'success';
    }).catch(err => {
      if(err.status === 403) {
        let errData = '验证码发送错误';
        if(err.data === 'invalid ref code') { errData = '发送错误，无效的邀请码'; }
        if(err.data === 'email in black list') { errData = '发送错误，请更换邮箱尝试'; }
        if(err.data === 'send email out of limit') { errData = '请求过于频繁，请稍后再试'; }
        if(err.data === 'signup close') { errData = '当前时段尚未开放注册'; }
        return Promise.reject(errData);
      } else {
        return Promise.reject('网络异常，请稍后再试');
      }
    });
  };
  const findPassword = email => {
    if(!email) {
      return Promise.reject('请输入邮箱地址再点击“找回密码”');
    };
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
    userSignup,
    userLogin,
    sendCode,
    findPassword,
  };
}]);
