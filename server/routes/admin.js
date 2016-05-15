var app = global.app;

var admin = require('../controllers/admin');
var auth = require('../controllers/auth');

app.post('/admin/server', auth.isAdmin, admin.addServer);
app.get('/admin/server', auth.isAdmin, admin.getServers);
app.put('/admin/server', auth.isAdmin, admin.editServer);
app.delete('/admin/server', auth.isAdmin, admin.deleteServer);

app.post('/admin/serverPort', auth.isAdmin, admin.addServerPort);
app.delete('/admin/serverPort', auth.isAdmin, admin.deleteServerPort);

app.get('/admin/flow',
    auth.isAdmin,
    admin.getFlow
);