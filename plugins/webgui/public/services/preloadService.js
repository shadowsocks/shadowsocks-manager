const app = angular.module('app');

app.factory('preload', ['$http', '$q', 'moment', ($http, $q, moment) => {
  const pool = {};
  const clean = () => {
    for(const p in pool) {
      if(pool[p].expire < Date.now()) {
        delete pool[p];
      }
    }
  };
  const set = (id, promise, time) => {
    pool[id] = {
      promise: promise(),
      expire: Date.now() + time,
    };
  };
  const get = (id, promise, time) => {
    clean();
    if(pool[id] && !pool[id].promise.$$state.status) {
      return pool[id].promise;
    } else if (pool[id] && pool[id].data && Date.now() <= pool[id].expire) {
      return $q.resolve(pool[id].data);
    } else {
      set(id, promise, time);
      return pool[id].promise.then(success => {
        pool[id].data = success;
        return success;
      });
    }
  };
  return {
    get,
  };
}]);
