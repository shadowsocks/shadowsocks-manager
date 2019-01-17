const app = angular.module('app');

app.config(['$sceProvider', $sceProvider => {
  $sceProvider.enabled(false);
}]);
