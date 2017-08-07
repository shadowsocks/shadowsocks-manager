const app = angular.module('app');

app.service('authInterceptor', ['$q', '$localStorage', function($q, $localStorage) {
  const service = this;
  service.responseError = function(response) {
    if (response.status == 401) {
      $localStorage.home = {};
      $localStorage.admin = {};
      $localStorage.user = {};
      window.location = '/';
    }
    return $q.reject(response);
  };
}]).config(['$httpProvider', '$compileProvider', ($httpProvider, $compileProvider) => {
  $httpProvider.interceptors.push('authInterceptor');
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|http|ss):/);
}])
;