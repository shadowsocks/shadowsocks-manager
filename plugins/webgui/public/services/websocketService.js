const app = require('../index').app;
app.factory('MyData', function($websocket) {
  // Open a WebSocket connection
  var dataStream = $websocket('ws://v1.gyteng.com:8080');
  var collection = [];
  dataStream.onMessage(function(message) {
    collection.push(JSON.parse(message.data));
  });
  var methods = {
    collection: collection,
    get: function() {
      dataStream.send(JSON.stringify({
        action: 'get'
      }));
    }
  };
  return methods;
});
