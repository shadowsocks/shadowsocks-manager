var ss = require('./shadowsocks');
var users = require('./config').users;

ss.setRateToZero('0002', function(err) {
    
});
//ss.limitTraffic('0002');


// console.log('getTrafficRate:');
// ss.getTrafficRate('0001', function(err, traff) {
//     if(!err) {
//         console.log(traff);
//     }
// });