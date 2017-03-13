const exec = require('child_process').exec;

exports.getConnectionIp = port => {
  const cmd = `netstat -ntu | grep ":${port} " | grep ESTABLISHED | awk '{print $5}' | cut -d: -f1 | grep -v 127.0.0.1 | uniq -d`;
  return new Promise((resolve, reject) => {
    exec(cmd, function (err, stdout, stderr) {
      if (err) {
        reject(stderr);
      } else {
        const result = [];
        stdout.split('\n').filter(f => f).forEach(f => {
          if (result.indexOf(f) < 0) {
            result.push(f);
          }
        });
        resolve(result);
      }
    });
  });
};