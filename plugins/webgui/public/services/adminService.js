const app = angular.module('app');

app.factory('adminApi', ['$http', '$q', 'moment', 'preload', '$timeout', 'configManager', ($http, $q, moment, preload, $timeout, configManager) => {
  const config = configManager.getConfig();
  const getUser = (opt = {}) => {
    const search = opt.search || '';
    // const filter = opt.filter || 'all';
    const sort = opt.sort || 'id_desc';
    const page = opt.page || 1;
    const pageSize = opt.pageSize || 20;
    const group = opt.hasOwnProperty('group') ? opt.group : -1;
    const type = [];
    for(const i in opt.type) {
      if(opt.type[i]) { type.push(i); }
    };
    return $http.get('/api/admin/user', { params: {
      search,
      sort,
      page,
      pageSize,
      group,
      type,
    } }).then(success => success.data);
  };
  const getOrder = (payType, opt = {}) => {
    if(payType === 'Paypal') {
      opt.filter = opt.filter.map(m => {
        if(m === 'CREATE') return 'created';
        if(m === 'TRADE_SUCCESS') return 'approved';
        if(m === 'FINISH') return 'finish';
      }).filter(f => f);
    }
    let url;
    if(payType === '支付宝') { url = '/api/admin/alipay'; }
    if(payType === 'Paypal') { url = '/api/admin/paypal'; }
    if(payType === '充值码') { url = '/api/admin/giftcard'; }
    if(payType === '邀请码') { url = '/api/admin/refOrder'; }
    const search = opt.search || '';
    const filter = opt.filter || '';
    // const sort = opt.sort || 'alipay.createTime_desc';
    const page = opt.page || 1;
    const pageSize = opt.pageSize || 20;
    return $http.get(url, { params: opt }).then(success => success.data);
  };

  const getCsvOrder = (payType, opt = {}) => {
    let url;
    if(payType === '支付宝') { url = '/api/admin/alipay/csv'; }
    if(payType === 'Paypal') { url = '/api/admin/paypal/csv'; }
    if(payType === '充值码') { url = '/api/admin/giftcard/csv'; }
    if(payType === '邀请码') { url = '/api/admin/refOrder/csv'; }
    let downloadUrl = url + '?';
    for(const o in opt) {
      if(Array.isArray(opt[o])) {
        opt[o].forEach(f => {
          downloadUrl += (o + '=' + f + '&');
        });
      } else if (opt[o] || opt[o] >= 0) {
        downloadUrl += (o + '=' + opt[o] + '&');
      }
    }
    window.open(downloadUrl, '_blank');
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

  let macAccountPromise = null;
  const getMacAccount = () => {
    if(macAccountPromise && !macAccountPromise.$$state.status) {
      return macAccountPromise;
    }
    macAccountPromise = $http.get('/api/admin/macAccount').then(success => success.data);
    return macAccountPromise;
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
      $http.get('/api/admin/flow/top').then(success => success.data),
    ]).then(success => {
      return {
        signup: success[0],
        login: success[1],
        order: success[2],
        paypalOrder: success[3],
        topFlow: success[4],
      };
    });
    return indexInfoPromise;
  };

  const getUserData = userId => {
    const promises = [
      $http.get('/api/admin/user/' + userId),
      $http.get('/api/admin/alipay/' + userId),
      $http.get('/api/admin/paypal/' + userId),
      $http.get('/api/admin/refOrder/' + userId),
      config.giftcard ? $http.get('/api/admin/giftcard/' + userId) : $q.resolve({ data: [] }),
      $http.get('/api/admin/server'),
      $http.get('/api/admin/account/mac', { params: { userId } }),
      $http.get('/api/admin/ref/user/' + userId),
      $http.get('/api/admin/ref/code/' + userId),
    ];
    return $q.all(promises).then(success => {
      return {
        user: success[0].data,
        alipayOrders: success[1].data,
        paypalOrders: success[2].data,
        refOrders: success[3].data,
        giftCardOrders: success[4].data,
        server: success[5].data,
        macAccount: success[6].data,
        refUsers: success[7].data,
        refCodes: success[8].data,
      };
    });
  };

  const getAdminData = userId => {
    return $http.get('/api/admin/admin/' + userId).then(success => {
      return {
        user: success.data
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

  const changePassword = (password, newPassword) => {
    return $http.post('/api/admin/setting/changePassword', {
      password,
      newPassword,
    });
  };

  return {
    getUser,
    getOrder,
    getCsvOrder,
    getServer,
    getAccount,
    getMacAccount,
    getServerFlow,
    getServerFlowLastHour,
    getAccountId,
    getIndexInfo,
    getServerPortData,
    getUserData,
    getAdminData,
    getChartData,
    getAccountChartData,
    getUserPortLastConnect,
    getIpInfo,
    changePassword,
  };
}]);
