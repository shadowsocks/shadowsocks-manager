const app = angular.module('app');


app.factory('adminApi', ['$http', '$q', 'moment', 'preload', '$timeout', ($http, $q, moment, preload, $timeout) => {
  const getUser = (opt = {}) => {
    const search = opt.search || '';
    const filter = opt.filter || 'all';
    const sort = opt.sort || 'id';
    const page = opt.page || 1;
    const pageSize = opt.pageSize || 20;
    return $http.get('/api/admin/user', { params: opt }).then(success => success.data);
  };
  const getOrder = (payType, opt = {}) => {
    if(payType === 'Paypal') {
      opt.filter = opt.filter.map(m => {
        if(m === 'CREATE') return 'created';
        if(m === 'TRADE_SUCCESS') return 'approved';
        if(m === 'FINISH') return 'finish';
      }).filter(f => f);
    }
    const url = payType === '支付宝' ? '/api/admin/alipay' : '/api/admin/paypal';
    const search = opt.search || '';
    const filter = opt.filter || '';
    // const sort = opt.sort || 'alipay.createTime_desc';
    const page = opt.page || 1;
    const pageSize = opt.pageSize || 20;
    return $http.get(url, { params: opt }).then(success => success.data);
  };
  
  const getServer = status => {
    return $http.get('/api/admin/server', {
      params: {
        status
      }
    }).then(success => success.data);
  };

  let accountPromise = null;
  const getAccount = () => {
    if(accountPromise && !accountPromise.$$state.status) {
      return accountPromise;
    }
    accountPromise = $http.get('/api/admin/account').then(success => success.data);
    return accountPromise;
  };

  const getServerFlow = serverId => {
    return $q.all([
      $http.get('/api/admin/flow/' + serverId, {
        params: {
          time: [
            moment().hour(0).minute(0).second(0).millisecond(0).toDate().valueOf(),
            moment().toDate().valueOf(),
          ],
        }
      }),
      $http.get('/api/admin/flow/' + serverId, {
        params: {
          time: [
            moment().day(0).hour(0).minute(0).second(0).millisecond(0).toDate().valueOf(),
            moment().toDate().valueOf(),
          ],
        }
      }),
      $http.get('/api/admin/flow/' + serverId, {
        params: {
          time: [
            moment().date(1).hour(0).minute(0).second(0).millisecond(0).toDate().valueOf(),
            moment().toDate().valueOf(),
          ],
        }
      }),
    ]).then(success => {
      return {
        today: success[0].data[0],
        week: success[1].data[0],
        month: success[2].data[0],
      };
    });
  };

  let serverFlowLastHourPromise = {};
  const getServerFlowLastHour = serverId => {
    if(serverFlowLastHourPromise[serverId] && !serverFlowLastHourPromise[serverId].$$state.status) {
      return serverFlowLastHourPromise[serverId];
    }
    serverFlowLastHourPromise[serverId] = $http.get('/api/admin/flow/' + serverId + '/lastHour').then(success => {
      return {
        time: success.data.time,
        flow: success.data.flow,
      };
    });
    return serverFlowLastHourPromise[serverId];
  };

  const getAccountId = port => {
    return $http.get('/api/admin/account/port/' + port).then(success => success.data.id);
  };

  let indexInfoPromise = null;
  const getIndexInfo = () => {
    if(indexInfoPromise && !indexInfoPromise.$$state.status) {
      return indexInfoPromise;
    }
    indexInfoPromise = $q.all([
      $http.get('/api/admin/user/recentSignUp').then(success => success.data),
      $http.get('/api/admin/user/recentLogin').then(success => success.data),
      $http.get('/api/admin/alipay/recentOrder').then(success => success.data),
      $http.get('/api/admin/paypal/recentOrder').then(success => success.data),
    ]).then(success => {
      return {
        signup: success[0],
        login: success[1],
        order: success[2],
        paypalOrder: success[3],
      };
    });
    return indexInfoPromise;
  };

  const getUserData = (userId) => {
    const macAccount = JSON.parse(window.ssmgrConfig).macAccount;
    const promises = [
      $http.get('/api/admin/user/' + userId),
      $http.get('/api/admin/alipay/' + userId),
      $http.get('/api/admin/paypal/' + userId),
      $http.get('/api/admin/server'),
    ];
    if(macAccount) {
      promises.push($http.get('/api/admin/account/mac', {
        params: {
          userId,
        }
      }));
    } else {
      promises.push($q.resolve({
        data: [],
      }));
    }
    return $q.all(promises).then(success => {
      return {
        user: success[0].data,
        alipayOrders: success[1].data,
        paypalOrders: success[2].data,
        server: success[3].data,
        macAccount: success[4].data,
      };
    });
  };
  
  const getChartData = (serverId, type, time, doNotPreload) => {
    let queryTime;
    if(type === 'hour') {
      !doNotPreload && $timeout(() => { getChartData(serverId, type, time - 3600000, true); }, 500);
      !doNotPreload && $timeout(() => { getChartData(serverId, type, time - 2 * 3600000, true); }, 600);
      !doNotPreload && $timeout(() => { getChartData(serverId, type, time - 3 * 3600000, true); }, 700);
      queryTime = moment(time).minute(0).second(0).millisecond(0).toDate().getTime();
    }
    if(type === 'day') {
      !doNotPreload && $timeout(() => { getChartData(serverId, type, time - 24 * 3600000, true); }, 500);
      !doNotPreload && $timeout(() => { getChartData(serverId, type, time - 2 * 24 * 3600000, true); }, 600);
      !doNotPreload && $timeout(() => { getChartData(serverId, type, time - 3 * 24 * 3600000, true); }, 700);
      queryTime = moment(time).hour(0).minute(0).second(0).millisecond(0).toDate().getTime();
    }
    if(type === 'week') {
      !doNotPreload && $timeout(() => { getChartData(serverId, type, time - 7 * 24 * 3600000, true); }, 500);
      !doNotPreload && $timeout(() => { getChartData(serverId, type, time - 2 * 7 * 24 * 3600000, true); }, 600);
      !doNotPreload && $timeout(() => { getChartData(serverId, type, time - 3 * 7 * 24 * 3600000, true); }, 700);
      queryTime = moment(time).day(0).hour(0).minute(0).second(0).millisecond(0).toDate().getTime();
    }
    const id = `getChartData:${ serverId }:${ type }:${ queryTime }`;
    const promise = () => {
      return $q.all([
        $http.get(`/api/admin/flow/${ serverId }`, {
          params: {
            type,
            time: queryTime,
          }
        }),
        $http.get(`/api/admin/flow/${ serverId }/user`, {
          params: {
            type,
            time: queryTime,
          }
        }),
      ]);
    };
    return preload.get(id, promise, 90 * 1000);
  };

  const getAccountChartData = (serverId, accountId, type, time, doNotPreload) => {
    let queryTime;
    if(type === 'hour') {
      !doNotPreload && getAccountChartData(serverId, accountId, type, time - 3600000, true);
      !doNotPreload && getAccountChartData(serverId, accountId, type, time - 2 * 3600000, true);
      !doNotPreload && getAccountChartData(serverId, accountId, type, time - 3 * 3600000, true);
      queryTime = moment(time).minute(0).second(0).millisecond(0).toDate().getTime();
    }
    if(type === 'day') {
      !doNotPreload && getAccountChartData(serverId, accountId, type, time - 24 * 3600000, true);
      !doNotPreload && getAccountChartData(serverId, accountId, type, time - 2 * 24 * 3600000, true);
      !doNotPreload && getAccountChartData(serverId, accountId, type, time - 3 * 24 * 3600000, true);
      queryTime = moment(time).hour(0).minute(0).second(0).millisecond(0).toDate().getTime();
    }
    if(type === 'week') {
      !doNotPreload && getAccountChartData(serverId, accountId, type, time - 7 * 24 * 3600000, true);
      !doNotPreload && getAccountChartData(serverId, accountId, type, time - 2 * 7 * 24 * 3600000, true);
      !doNotPreload && getAccountChartData(serverId, accountId, type, time - 3 * 7 * 24 * 3600000, true);
      queryTime = moment(time).day(0).hour(0).minute(0).second(0).millisecond(0).toDate().getTime();
    }
    const id = `getAccountChartData:${ serverId }:${ accountId }:${ type }:${ queryTime }`;
    const promise = () => {
      return $q.all([
        $http.get(`/api/admin/flow/${ serverId }`, {
          params: {
            accountId,
            type,
            time: time,
          }
        }),
        $http.get(`/api/admin/flow/account/${ accountId }`, {
          params: {
            type,
            time: time,
          }
        })
      ]);
    };
    return preload.get(id, promise, 90 * 1000);
  };

  const getServerPortData = (serverId, accountId) => {
    const id = `getServerPortData:${ serverId }:${ accountId }:`;
    const promise = () => {
      return $q.all([
        $http.get(`/api/admin/flow/${ serverId }/${ accountId }`),
        $http.get(`/api/admin/flow/${ serverId }/${ accountId }/lastConnect`)
      ]).then(success => {
        return {
          serverPortFlow: success[0].data[0],
          lastConnect: success[1].data.lastConnect,
        };
      });
    };
    return preload.get(id, promise, 60 * 1000);
  };

  const getUserPortLastConnect = accountId => {
    return $http.get(`/api/admin/user/${ accountId }/lastConnect`).then(success => success.data);
  };

  const getIpInfo = ip => {
    const id = `getIpInfo:${ ip }`;
    const promise = () => {
      const url = `/api/admin/account/ip/${ ip }`;
      return $http.get(url).then(success => success.data);
    };
    return preload.get(id, promise, 300 * 1000);
  };

  return {
    getUser,
    getOrder,
    getServer,
    getAccount,
    getServerFlow,
    getServerFlowLastHour,
    getAccountId,
    getIndexInfo,
    getServerPortData,
    getUserData,
    getChartData,
    getAccountChartData,
    getUserPortLastConnect,
    getIpInfo,
  };
}]);
