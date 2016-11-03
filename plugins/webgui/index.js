'use strict';

const path = require('path');
const express = require('express');
const app =  express();
app.use('/public', express.static(path.resolve('./plugins/webgui/public')));

const httpserver = app.listen(80, '0.0.0.0', function () {

});
