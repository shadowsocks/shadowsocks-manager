var app = global.app;

app.get('/email', function(req, res){
    res.render('login', {});
});