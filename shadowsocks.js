var ip      = require('./config').serverIp;
var users   = require('./config').users;
var process = require('child_process');

exports.startShadowSocks = function(config, callback) {
    var ss = process.spawn('ss-server', ['-s', ip,
        '-p', config.port,
        '-k', config.password,
        '-m', config.method,
        '-t', '60', '-q'
    ]);
    ss.stderr.on('data', function(data) {
        console.log('stderr: ' + data);
    });
    ss.stdout.on('data', function(data) {
        console.log('stdout: ' + data);
    });
};

exports.setRateToZero = function(name, callback) {
    users.forEach(function(user) {
        if (user.name === name) {
            var cmd0 = 'iptables -D OUTPUT -s ' + ip + ' -p tcp --sport ' + user.port;
            var cmd1 = 'iptables -D OUTPUT -s ' + ip + ' -p tcp --sport ' + user.port + ' -j DROP';
            var cmd2 = 'iptables -I OUTPUT -s ' + ip + ' -p tcp --sport ' + user.port;
            process.exec(cmd0);
            process.exec(cmd1);
            process.exec(cmd2);
            callback(null);
        }
    });
};

exports.limitTraffic = function(name, callback) {
    users.forEach(function(user) {
        if (user.name === name) {
            var cmd0 = 'iptables -D OUTPUT -s ' + ip + ' -p tcp --sport ' + user.port;
            var cmd1 = 'iptables -I OUTPUT -s ' + ip + ' -p tcp --sport ' + user.port + ' -j DROP';
            process.exec(cmd0);
            process.exec(cmd1);
            callback(null);
        }
    });
};

exports.getTrafficRate = function(name, callback) {
    users.forEach(function(user) {
        if (user.name === name) {
            var cmd = 'iptables -n -L -v -x | grep "spt:' + user.port + '" | awk \'{print $2}\'';
            var iptables = process.exec(cmd, function(error, stdout, stderr) {
                if (error) {
                    console.log('exec error: ' + error);
                    callback(error);
                } else {
                    callback(null, stdout);
                }
            });
        }
    });
};


    // for(var user in users) {
    //     if (users[user].name === name) {
    //         var cmd = 'iptables -n -L -v -x | grep "spt:' + users[user].port + '" | awk \'{print $2}\'';
    //         console.log(cmd);
    //         var iptables = process.exec(cmd, function(error, stdout, stderr) {
    //             // console.log('stdout: ' + stdout);
    //             // console.log('stderr: ' + stderr);
    //             if (error) {
    //                 console.log('exec error: ' + error);
    //                 //callback(error);
    //             } else {
    //                 //callback(null, stdout);
    //             }
    //         });
    //     }
    // }
};