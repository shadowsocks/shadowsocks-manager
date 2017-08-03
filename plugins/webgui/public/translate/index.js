const app = angular.module('app');
app.config(['$translateProvider', $translateProvider => {
  $translateProvider.translations('en-US', require('./en-US.js'));
  $translateProvider.translations('zh-CN', require('./zh-CN.js'));
  $translateProvider.preferredLanguage(navigator.language || 'zh-CN');
  $translateProvider.useSanitizeValueStrategy('escape');
}]);

