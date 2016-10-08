'use strict';

const path = require('path');
module.exports = function (ctx, next) {
  ctx.task(path.resolve(__dirname, '../models'));
  next();
};
