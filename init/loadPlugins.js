const path = require('path');
const config = appRequire('services/config').all();
if(!config.plugins) {
  return;
}
if(config.type !== 'm') {
  return;
}
for(const name in config.plugins) {
  if(config.plugins[name].use) {
    console.log(`Load plugin: ${ name }`);
    appRequire(`plugins/${ name }/index`);
  }
}
