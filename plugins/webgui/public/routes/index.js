const req = require.context('./', true, /^(?!.*index.js)((.*\.(js\.*))[^.]*$)/igm);
req.keys().forEach(file => {
  req(file);
});