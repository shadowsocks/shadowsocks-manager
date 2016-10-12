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
  // const dbPromises = [];
  // const indexPromises = [];
  for(const name in config.plugins) {
    if(config.plugins[name].use) {
      const promises = [];
      console.log(`Load plugin: ${ name }`);
      try {
        const files = fs.readdirSync(path.resolve(__dirname, `../plugins/${ name }`));

        if(files.indexOf('db') >= 0) {
          const dbFiles = fs.readdirSync(path.resolve(__dirname, `../plugins/${ name }/db`));
          dbFiles.forEach(f => {
            console.log(`Load plugin db: ${ name }/db/${ f }`);
            promises.push(appRequire(`plugins/${ name }/db/${ f }`).createTable());
          });
        }
        // const promises = [];
        // list.forEach(f => {
        //   promises.push(appRequire(`plugins/${ name }/db/${ f }`).createTable());
        // });

      } catch(err) {
        console.log(err);
        // appRequire(`plugins/${ name }/index`);
      }
      Promise.all(promises).then(() => {
        console.log(`Load plugin index: ${ name }/index`);
        appRequire(`plugins/${ name }/index`);
      }).catch(err => {
        console.log(err);
      });
    }
  }
};
loadPlugins();
