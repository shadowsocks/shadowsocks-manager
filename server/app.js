require('./routes/login');
require('./routes/admin');
var express = global.express;
var app = global.app;


app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

app.use('/libs', express.static('./bower_components'));
app.use('/public', express.static('./public'));