const req = require.context('./', true, /^(?!.*index.js)((.*\.(js\.*))[^.]*$)/im);
req.keys().forEach(file => {
  req(file);
});
