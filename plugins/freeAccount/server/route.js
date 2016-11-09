'use strict';

const app = appRequire('plugins/freeAccount/index').app;
const user = appRequire('plugins/freeAccount/server/user');

app.post('/email', user.sendEmail);
app.post('/code', user.checkCode);
app.post('/account', user.getAccount);
app.get('*', user.render);
