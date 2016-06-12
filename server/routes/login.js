var app = global.app;
var home = require('../controllers/home');
var auth = require('../controllers/auth');

var render = function(req, res) {
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
        res.redirect('/admin');
    } else {
        res.redirect('/user');
    }
};

var renderAdmin = function(req, res) {
    return res.render('admin', {
        'controllers': [
            '/public/controllers/adminMain.js',
            '/public/controllers/adminServer.js',
            '/public/controllers/admin.js'
        ],
        'routes': [
            '/public/routes/admin.js'
        ]
    });
};
var renderUser = function(req, res) {
    return res.render('user', {
        'controllers': [
            '/public/controllers/userMain.js',
            '/public/controllers/user.js'
        ],
        'routes': [
            '/public/routes/user.js'
        ]
    });
};

app.get('/', render);

app.get('/user', auth.isUser, renderUser);
app.get('/user/', auth.isUser, renderUser);
app.get(/^\/user\/[\s\S]/, auth.isUser, renderUser);

app.get(/^\/home\/[\s\S]/, render);

app.get('/admin', auth.isAdmin, renderAdmin);
app.get('/admin/', auth.isAdmin, renderAdmin);
app.get(/^\/admin\/[\s\S]/, auth.isAdmin, renderAdmin);

app.post('/api/home/signup', home.signup);
app.post('/api/home/login', home.login);
app.post('/api/home/logout', home.logout);

app.post('/api/home/email', home.sendEmail);
app.post('/api/home/active', home.activeEmail);