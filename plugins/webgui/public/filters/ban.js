const app = angular.module('app');

app.filter('ban', function() {
  return function(input) {
    if(input <= 30) {
      return input;
    } else if (input === 35) {
      return 45;
    } else if (input === 40) {
      return 60;
    } else if (input === 45) {
      return 75;
    } else if (input === 50) {
      return 90;
    } else if (input === 55) {
      return 120;
    } else if (input === 60) {
      return 180;
    } else if (input === 65) {
      return 240;
    } else {
      return input;
    }
  };
});
