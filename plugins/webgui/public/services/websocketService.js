const app = angular.module('app');

app.factory('ws', ['$websocket', '$location', '$timeout', ($websocket, $location, $timeout) => {
  const protocol = $location.protocol() === 'http' ? 'ws://' : 'wss://';
  const url = protocol + $location.host() + ':' + $location.port() + '/user';
  let connection = null;
  const messages = [];
  const connect = () => {
    connection = $websocket(url);
    connection.onMessage(function(message) {
      console.log(message.data);
      messages.push(message.data);
    });
    connection.onClose(() => {
      $timeout(() => {
        connect();
      }, 3000);
    });
  };
  connect();
  const methods = {
    messages,
    send: function (msg) {
      connection.send(msg);
    },
  };
  return methods;
}]);
