const knex = appRequire('init/knex').knex;
const manager = appRequire('services/manager');
const config = appRequire('services/config').all();

const addAffiliates = (registeringIpAddress, registeringUserId, registeringDatetime, referrerUserId, flow, duration) => {
  return knex('affiliates').insert({
    registeringIpAddress: registeringIpAddress,
    registeringUserId: registeringUserId,
    registeringDatetime: registeringDatetime,
    referrerUserId: referrerUserId,
    flow: flow,
    duration: duration,
  });
};

const checkRegisteringIpAddress = (registeringIpAddress) => {
  const where = {};
  where['registeringIpAddress'] = registeringIpAddress;
  
  return knex('affiliates')
    .count('id as count')
    .where(where);
};

const getAffiliatesRecords = async (referrerUserId) => {
  const where = {};
  where['referrerUserId'] = referrerUserId;

  const affiliatesRecords = await knex('affiliates')
  .count('id as count')
  .sum('flow as flow')
  .sum('duration as duration')
  .where(where);

  return affiliatesRecords[0];
};

const getAllAffiliatesRecords = async () => {
  const affiliatesRecords = await knex('affiliates')
  .count('id as count')
  .sum('flow as flow')
  .sum('duration as duration')
  .whereNotNull('referrerUserId');

  return affiliatesRecords[0];
};

exports.addAffiliates = addAffiliates;
exports.checkRegisteringIpAddress = checkRegisteringIpAddress;
exports.getAffiliatesRecords = getAffiliatesRecords;
exports.getAllAffiliatesRecords = getAllAffiliatesRecords;