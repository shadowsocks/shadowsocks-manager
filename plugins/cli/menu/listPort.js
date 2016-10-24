'use strict';

const manager = appRequire('services/manager');
const index = appRequire('plugins/cli/index');

const list = async () => {
  try {
    const result = await manager.send({
      command: 'list',
    }, index.getManagerAddress());
    console.log(result);
  } catch(err) {
    console.log(err);
  } finally {
    return { confirm: false };
  }
};

exports.list = list;
