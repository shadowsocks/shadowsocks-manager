const app = require('../index').app;

app.factory('adminApi', ['$http', '$q', ($http, $q) => {
  const getUser = () => {
    return $http.get('/api/admin/user').then(success => success.data);
  };
  const getOrder = () => {
    return $http.get('/api/admin/order').then(success => success.data);
  };
  const getServer = () => {
    return $http.get('/api/admin/server').then(success => success.data);
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
  const getServerFlowThisHour = serverId => {
    return $http.get('/api/admin/flow/' + serverId, {
      params: { type: 'hour' }
    }).then(success => {
      return {
        flow: success.data,
      };
    });
  };

  let serverFlowLastHourPromise = null;
  const getServerFlowLastHour = serverId => {
    if(serverFlowLastHourPromise && !serverFlowLastHourPromise.$$state.status) {
      return serverFlowLastHourPromise;
    }
    serverFlowLastHourPromise = $http.get('/api/admin/flow/' + serverId + '/lastHour').then(success => {
      return {
        time: success.data.time,
        flow: success.data.flow,
      };
    });
    return serverFlowLastHourPromise;
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
    ]).then(success => {
      return {
        signup: success[0],
        login: success[1],
      };
    });
    return indexInfoPromise;
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
    getServer,
    getServerFlow,
    getServerFlowThisHour,
    getServerFlowLastHour,
    getAccountId,
    getIndexInfo,
    getServerPortData,
  };
}]);
