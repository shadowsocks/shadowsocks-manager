var app = global.app;

var user = require('../controllers/user');
var auth = require('../controllers/auth');
var flow = require('../controllers/flow');

app.get('/api/user/userInfo', auth.isUser, user.getUserInfo);

app.put('/api/user/password', auth.isUser, user.changePassword);

app.post('/api/user/code', auth.isUser, user.useCode);

app.post('/api/user/flowChart', auth.isUser, flow.getFlowChart);