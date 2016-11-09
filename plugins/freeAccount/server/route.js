'use strict';

const app = appRequire('plugins/freeAccount/index').app;
const user = appRequire('plugins/freeAccount/server/user');
const manager = appRequire('plugins/freeAccount/server/manager');

app.post('/email', user.sendEmail);
app.post('/code', user.checkCode);
app.post('/account', user.getAccount);
app.post('/password', manager.checkPassword);
app.get('*', user.render);
