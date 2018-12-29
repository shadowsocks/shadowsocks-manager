const app = angular.module('app');

app.factory('configManager', [() => {
  let config = {};
  const setConfig = data => {
    config = data;
  };
  const getConfig = () => {
    return config;
  };
  const deleteConfig = () => {
    config = {};
  };
  return { setConfig, getConfig, deleteConfig };
}]);
