const path = require('path');
module.exports = function (ctx, next) {
  const config = ctx.config.all();
  if(!config.plugins) {
    return;
  }
  if(config.type !== 'm') {
    return;
  }
  for(const name in config.plugins) {
    if(config.plugins[name].use) {
      console.log(`Load plugin: ${ name }`);
      ctx.task(path.resolve(__dirname, `../plugins/${ name }/index.js`));
    }
  }
  next();
};
