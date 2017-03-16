const app = angular.module('app');

app.filter('substr', function() {
  return function(input, number = 20) {
    if(input.toString().length > number) {
      return input.toString().substr(0, number) + '...';
    }
    return input;
  };
});
