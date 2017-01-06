const app = require('../index').app;

app.filter('flow', function() {
  return function(input) {
    if (input < 1000) {
      return input + ' B';
    } else if (input < 1000000) {
      return (input / 1000).toFixed(1) + ' KB';
    } else if (input < 1000000000) {
      return (input / 1000000).toFixed(1) + ' MB';
    } else if (input < 1000000000000) {
      return (input / 1000000000).toFixed(2) + ' GB';
    } else {
      return input;
    }
  };
});
