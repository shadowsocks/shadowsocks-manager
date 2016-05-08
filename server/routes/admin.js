var app = global.app;

var admin = require('../controllers/admin');
var auth = require('../controllers/auth');

app.post('/admin/server', auth.isAdmin, admin.addServer);
app.get('/admin/server', auth.isAdmin, admin.getServers);

app.post('/admin/serverPort', auth.isAdmin, admin.addServerPort);
app.delete('/admin/serverPort', auth.isAdmin, admin.deleteServerPort);