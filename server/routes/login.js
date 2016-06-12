var app = global.app;
var home = require('../controllers/home');

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
        // return res.render('admin', {
        //     'controllers': [
        //         '/public/controllers/adminMain.js',
        //         '/public/controllers/adminServer.js',
        //         '/public/controllers/admin.js'
        //     ],
        //     'routes': [
        //         '/public/routes/admin.js'
        //     ]
        // });
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
app.get('/', render);

app.get(/^\/user\/[\s\S]/, render);
app.get(/^\/home\/[\s\S]/, render);
app.get('/admin', renderAdmin);
app.get(/^\/admin[\s\S]/, renderAdmin);

app.post('/api/home/signup', home.signup);
app.post('/api/home/login', home.login);
app.post('/api/home/logout', home.logout);

app.post('/api/home/email', home.sendEmail);
app.post('/api/home/active', home.activeEmail);