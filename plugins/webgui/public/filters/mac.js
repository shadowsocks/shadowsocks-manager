const app = angular.module('app');

app.filter('mac', function() {
  return function(mac) {
    return mac.toUpperCase().split('').map((m, index, array) => {
      if(index % 2 === 0) {
        return m + array[index + 1];
      }
    }).filter(f => f).join(':');
  };
});
