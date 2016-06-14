var app = global.app;

var admin = require('../controllers/admin');
var auth = require('../controllers/auth');
var later = require('../controllers/cron');
var flow = require('../controllers/flow');
var option = require('../controllers/option');

app.post('/api/admin/server', auth.isAdmin, admin.addServer);
app.get('/api/admin/server', auth.isAdmin, admin.getServers);
app.put('/api/admin/server', auth.isAdmin, admin.editServer);
app.delete('/api/admin/server', auth.isAdmin, admin.deleteServer);

app.post('/api/admin/account', auth.isAdmin, admin.addAccount);
app.put('/api/admin/account', auth.isAdmin, admin.editAccount);
app.post('/api/admin/accountAutoRemove', auth.isAdmin, admin.accountAutoRemove);
app.delete('/api/admin/account', auth.isAdmin, admin.deleteAccount);

app.post('/api/admin/userAccount', auth.isAdmin, admin.addUserAccount);
app.delete('/api/admin/userAccount', auth.isAdmin, admin.deleteUserAccount);

app.get('/api/admin/user', auth.isAdmin, admin.getUsers);

app.get('/api/admin/flow', auth.isAdmin, admin.getFlow);

app.get('/api/admin/code', auth.isAdmin, admin.getCode);
app.post('/api/admin/code', auth.isAdmin, admin.addCode);

app.post('/api/admin/flowChart',auth.isAdmin, flow.getFlowChart);

app.post('/api/admin/option', auth.isAdmin, flow.getOptions);