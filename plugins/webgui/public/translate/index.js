const app = angular.module('app');
app.config(['$translateProvider', $translateProvider => {
  $translateProvider.translations('en-US', require('./en-US.js'));
  $translateProvider.translations('zh-CN', require('./zh-CN.js'));
  $translateProvider.translations('ja-JP', require('./ja-JP.js'));
  $translateProvider.translations('ru-RU', require('./ru-RU.js'));
  $translateProvider.translations('ko-KR', require('./ko-KR.js'));
  $translateProvider.preferredLanguage(window.ssmgrConfig.language || navigator.language || 'zh-CN');
  $translateProvider.useSanitizeValueStrategy('escape');
}]);

