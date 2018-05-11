const app = angular.module('app');

app.factory('configManager', [() => {
  let config;
  const setConfig = data => {
    config = data;
  };
  const getConfig = () => {
    return config;
  };
  return { setConfig, getConfig };
}]);