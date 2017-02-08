const app = require('../index').app;
app.factory('MyData', ['$websocket', '$location', ($websocket, $location) => {
  const dataStream = $websocket('ws://' + $location.host() + ':' + $location.port());
  const collection = [];
  dataStream.onMessage(function(message) {
    console.log(message);
    collection.push(message.data);
  });
  const methods = {
    collection: collection,
    get: function() {
      dataStream.send(JSON.stringify({
        action: 'get'
      }));
    }
  };
  return methods;
}]);
