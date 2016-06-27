var app = global.app;

var system = require('../controllers/system');

app.post('/api/system/count', system.count);