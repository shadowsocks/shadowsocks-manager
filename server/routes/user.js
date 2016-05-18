var app = global.app;

var user = require('../controllers/user');
var auth = require('../controllers/auth');

app.get('/user/userInfo', auth.isUser, user.getUserInfo);