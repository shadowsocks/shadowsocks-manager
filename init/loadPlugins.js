'use strict';

const fs = require('fs');
const path = require('path');
const config = appRequire('services/config').all();
const loadPlugins = () => {
  if(!config.plugins) {
    return;
  }
  if(config.type !== 'm') {
    return;
  }
  for(const name in config.plugins) {
    if(config.plugins[name].use) {
      console.log(`Load plugin: ${ name }`);
      try {
        const list = fs.readdirSync(path.resolve(__dirname, `../plugins/${ name }/db`));
        const promises = [];
        list.forEach(f => {
          promises.push(appRequire(`plugins/${ name }/db/${ f }`).createTable());
        });
        Promise.all(promises).then(() => {
          appRequire(`plugins/${ name }/index`);
        });
      } catch(err) {
        appRequire(`plugins/${ name }/index`);
      }
    }
  }
};
loadPlugins();
