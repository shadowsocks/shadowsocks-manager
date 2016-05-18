var app = global.app;
var home = require('../controllers/home');

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
                '/public/controllers/adminMain.js',
                '/public/controllers/admin.js'
            ],
            'routes': [
                '/public/routes/admin.js'
            ]
        });
    } else {
        return res.render('user', {
            'controllers': [
                '/public/controllers/userMain.js',
                '/public/controllers/user.js'
            ],
            'routes': [
                '/public/routes/user.js'
            ]
        });
    }
    
});

app.post('/user/signup', home.signup);
app.post('/user/login', home.login);
app.post('/user/logout', home.logout);