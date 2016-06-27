var request = require('request');
var config = require('../../config').conf;
var version = require('../../package.json').version;

var log4js = require('log4js');
var logger = log4js.getLogger('system');

exports.count = (req, res) => {
    var address = req.body.address;
    var version = req.body.version;
    logger.info('[' + version + '] ' + address);
    res.send('');
};

exports.sendCount = () => {
    if(config.noCount) {return;}
    request({
        method: 'POST',
        url: 'http://ss.gyteng.com/api/system/count',
        form: {address: config.mail.webaddress, version: version}
    }, function() {});
};