var ss = require('./shadowsocks');
var users = require('./config').users;

ss.getTrafficRate('0001', function(err, data) {
    console.log(data);
});


// console.log('getTrafficRate:');
// ss.getTrafficRate('0001', function(err, traff) {
//     if(!err) {
//         console.log(traff);
//     }
// });