const fs = require('fs');
const path = require('path');
const config = appRequire('services/config').all();

const log4js = require('log4js');
const logger = log4js.getLogger('system');

const pluginLists = [];

const loadOnePluginDb = name => {
  const promises = [];
  logger.info(`Load plugin db: [ ${ name } ]`);
  try {
    const files = fs.readdirSync(path.resolve(__dirname, `../plugins/${ name }`));
    if(files.indexOf('db') >= 0) {
      const dbFiles = fs.readdirSync(path.resolve(__dirname, `../plugins/${ name }/db`));
      dbFiles.forEach(f => {
        logger.info(`Load plugin db: [ ${ name }/db/${ f } ]`);
        promises.push(appRequire(`plugins/${ name }/db/${ f }`).createTable());
      });
    }
  } catch(err) {
    logger.error(err);
  }
  return Promise.all(promises).then(() => {
    const dependence = appRequire(`plugins/${ name }/dependence`);
    logger.info(`Load plugin dependence: [ ${ name } ]`);
    dependence.forEach(pluginName => {
      if(pluginLists.indexOf(pluginName) < 0) {
        pluginLists.push(pluginName);
      }
    });
  }).catch(err => {
    // logger.error(err);
  });
};

const loadOnePlugin = name => {
  logger.info(`Load plugin: [ ${ name } ]`);
  appRequire(`plugins/${ name }/index`);
};

const loadPlugins = () => {
  if(!config.plugins) {
    return;
  }
  if(config.type !== 'm') {
    return;
  }
  for(const name in config.plugins) {
    if(config.plugins[name].use) {
      pluginLists.push(name);
    }
  }
  (async () => {
    for(let pl of pluginLists) {
      await loadOnePluginDb(pl);
    }
    for(let pl of pluginLists) {
      loadOnePlugin(pl);
    }
  })();
};
loadPlugins();
