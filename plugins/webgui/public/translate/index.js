const app = angular.module('app');

app.config(['$translateProvider', $translateProvider => {
  $translateProvider.translations('en', {
    '首页': 'HOME',
    '登录': 'SIGN IN',
    '注册': 'SIGN UP',
  });
  $translateProvider.translations('zh', {
  });
  $translateProvider.preferredLanguage('zh');
  $translateProvider.useSanitizeValueStrategy('escape');
}]);