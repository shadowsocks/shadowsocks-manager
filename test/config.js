global.configFile = './test/config.yml';
const config = require('../services/config');
const expect = require('chai').expect;

describe('Config file', function() {
  it('all', function() {
    expect(config.all().abc).to.be.equal(1234);
    expect(config.all().def).to.be.equal(5678);
  });
  it('get', function() {
    expect(config.get('abc')).to.be.equal(1234);
    expect(config.get('def')).to.be.equal(5678);
  });
  it('set', function() {
    config.set('ghi', 'qwer');
    expect(config.get('ghi')).to.be.equal('qwer');
  });
});
