var app = global.app;

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