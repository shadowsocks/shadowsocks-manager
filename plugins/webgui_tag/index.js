const knex = appRequire('init/knex').knex;

const getTags = async (type, key) => {
  if(key) {
    return knex('tag').select(['name']).where({ type, key }).then(success => success.map(m => m.name));
  }
  return knex('tag').select(['name']).where({ type }).groupBy('name').then(success => success.map(m => m.name));
};

const setTags = async (type, key, tags) => {
  const currentTags = await knex('tag').select(['id', 'name']).where({ type, key });
  for(const ct of currentTags) {
    if(!tags.includes(ct.name)) {
      await knex('tag').delete().where({ id: ct.id });
    }
  }
  const newTags = tags.filter(f => {
    return !currentTags.map(m => m.name).includes(f);
  }).map(tag => {
    return {
      type, key, name: tag,
    };
  });
  if(newTags.length) {
    await knex('tag').insert(newTags);
  }
};

const addTags = async (type, key, tags) => {
  const currentTags = await knex('tag').select(['id', 'name']).where({ type, key });
  const newTags = tags.filter(f => {
    return !currentTags.map(m => m.name).includes(f);
  }).map(tag => {
    return {
      type, key, name: tag,
    };
  });
  if(newTags.length) {
    await knex('tag').insert(newTags);
  }
};

const delTags = async (type, key, tags) => {
  for(const tag of tags) {
    await knex('tag').delete().where({ type, key, name: tag });
  }
};

exports.getTags = getTags;
exports.setTags = setTags;
exports.addTags = addTags;
exports.delTags = delTags;
