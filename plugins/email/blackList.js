const blackList = [
  '@mvrht.com',
  '@dispostable.com',
  '@yopmail.com',
  '@psoxs.com',
  '@chacuo.net',
  '@rcasd.com',
];

const isInBlackList = email => {
  return blackList.filter(f => {
    return email.match(f);
  }).length > 0;
};

exports.isInBlackList = isInBlackList;
