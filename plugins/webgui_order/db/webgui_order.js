const knex = appRequire('init/knex').knex;
const tableName = 'webgui_order';

const addDefaultOrder = async () => {
  const data = await knex('webgui_order').where({}).then(s => s[0]);
  if(!data) {
    const oldData = await knex('webguiSetting').where({ key: 'payment' }).then(s => JSON.parse(s[0].value));
    const types = {
      2: 'week',
      3: 'month',
      4: 'day',
      5: 'hour',
    };
    const insertData = [];
    for(const type in types) {
      insertData.push({
        id: type,
        name: oldData[types[type]].orderName,
        type,
        cycle: 1,
        alipay: oldData[types[type]].alipay,
        paypal: oldData[types[type]].paypal,
        autoRemove: oldData[types[type]].autoRemove ? 1 : 0,
        multiServerFlow: oldData[types[type]].multiServerFlow ? 1 : 0,
        changeOrderType: 1,
        flow: oldData[types[type]].flow * 1000 * 1000,
        server: oldData[types[type]].server ? JSON.stringify(oldData[types[type]].server) : null,
        refTime: 0,
      });
    }
    await knex(tableName).insert(insertData);
  }
  return;
};

const createTable = async () => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) {
    await addDefaultOrder();
    return;
  }
  await knex.schema.createTableIfNotExists(tableName, function(table) {
    table.increments('id').primary();
    table.string('name');
    table.string('comment').defaultTo('');
    table.integer('type');
    table.integer('cycle');
    table.integer('alipay');
    table.integer('paypal');
    table.bigInteger('flow');
    table.integer('refTime');
    table.string('server');
    table.integer('autoRemove').defaultTo(0);
    table.integer('multiServerFlow').defaultTo(0);
    table.integer('changeOrderType').defaultTo(0);
  });
  await addDefaultOrder();
  return;
};

exports.createTable = createTable;
