const app = require('../index').app;

app.directive('focusMe', ['$timeout', '$parse', ($timeout, $parse) => {
  return {
    link: function(scope, element, attrs) {
      const model = $parse(attrs.focusMe);
      scope.$watch(model, function(value) {
        if (value === true) {
          $timeout(function() {
            element[0].focus();
          });
        }
      });
      element.bind('blur', function() {
        scope.$apply(model.assign(scope, false));
      });
    }
  };
}]);
