var app = global.app;
var user = require('../controllers/user');

app.get('/', function(req, res) {
    res.render('login', {
        'controllers': [
            '/public/controllers/login.js'
        ],
        'routes': [
            '/public/routes/login.js'
        ]
    });
});

app.post('/user/signin', user.signin);