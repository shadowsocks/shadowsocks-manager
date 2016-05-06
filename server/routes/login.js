var app = global.app;
var user = require('../controllers/user');

app.get('/', function(req, res) {
    if(!req.session.user) {
        return res.render('login', {
            'controllers': [
                '/public/controllers/home.js'
            ],
            'routes': [
                '/public/routes/home.js'
            ]
        });
    } else if(req.session.isAdmin) {
        return res.render('admin', {
            'controllers': [
                '/public/controllers/admin.js'
            ],
            'routes': [
                '/public/routes/admin.js'
            ]
        });
    } else {
        return res.render('user', {
            'controllers': [
                '/public/controllers/user.js'
            ],
            'routes': [
                '/public/routes/user.js'
            ]
        });
    }
    
});

app.post('/user/signup', user.signup);
app.post('/user/login', user.login);
app.post('/user/logout', user.logout);