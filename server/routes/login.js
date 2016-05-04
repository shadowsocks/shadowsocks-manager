var app = global.app;
var user = require('../controllers/user');

app.get('/', function(req, res) {
    if(!req.session.user) {
        return res.render('login', {
            'controllers': [
                '/public/controllers/login.js'
            ],
            'routes': [
                '/public/routes/login.js'
            ]
        });
    } else if(req.session.isAdmin) {
        return res.render('admin', {});
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