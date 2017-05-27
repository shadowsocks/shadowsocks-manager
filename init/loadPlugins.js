const fs = require('fs');
const path = require('path');
const config = appRequire('services/config').all();

const log4js = require('log4js');
const logger = log4js.getLogger('system');

const loadPlugins = () => {
  if(!config.plugins) {
    return;
  }
  if(config.type !== 'm') {
    return;
  }
  for(const name in config.plugins) {
    if(config.plugins[name].use) {
      const promises = [];
      logger.info(`Load plugin: ${ name }`);
      try {
        const files = fs.readdirSync(path.resolve(__dirname, `../plugins/${ name }`));

        if(files.indexOf('db') >= 0) {
          const dbFiles = fs.readdirSync(path.resolve(__dirname, `../plugins/${ name }/db`));
          dbFiles.forEach(f => {
            logger.info(`Load plugin db: ${ name }/db/${ f }`);
            promises.push(appRequire(`plugins/${ name }/db/${ f }`).createTable());
          });
        }
      } catch(err) {
        logger.error(err);
      }
      Promise.all(promises).then(() => {
        logger.info(`Load plugin index: ${ name }/index`);
        appRequire(`plugins/${ name }/index`);
      }).catch(err => {
        logger.error(err);
      });
    }
  }
};
loadPlugins();
