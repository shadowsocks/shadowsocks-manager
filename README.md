[![NPM version][npm-image]][npm-url]
[![npm download][download-image]][download-url]
[![npm license][license-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/shadowsocks-manager.svg?style=flat-square
[npm-url]: https://npmjs.org/package/shadowsocks-manager
[download-image]: https://img.shields.io/npm/dm/shadowsocks-manager.svg?style=flat-square
[download-url]: https://npmjs.org/package/shadowsocks-manager
[license-image]: https://img.shields.io/npm/l/shadowsocks-manager.svg

# shadowsocks-manager

A shadowsocks manager tool for multi user and traffic control.  
Base on Node.js and SQLite.

This version is not a stable version now. If you want to use the old version, please switch to [this branch](https://github.com/shadowsocks/shadowsocks-manager/tree/version1).

## Dependencies

Node.js 6.*

## Install

### From source:

```
git clone https://github.com/shadowsocks/shadowsocks-manager.git
cd shadowsocks-manager
npm i
```
use `node server.js` to run this program.  

### From npm:
```
npm i -g shadowsocks-manager
```
use `ssmgr` to run this program.

### Usage
1. Start shadowsocks with [manager API](https://github.com/shadowsocks/shadowsocks/wiki/Manage-Multiple-Users), it supports `shadowsocks-python` and `shadowsocks-libev`.
For example, you can run this command:  
`ss-manager -m aes-256-cfb -u --manager-address 127.0.0.1:6001`
2. run ssmgr with type s:  
`ssmgr -t s -s 127.0.0.1:6001 -m 0.0.0.0:6002`
3. If you have several servers, you have to run step 1 and step 2 in every server.  
The listening address in `--manager-address` of step 1 and in `-s` of step 2 must be same. For security reseon, we recommend you to use `127.0.0.1` instead of `0.0.0.0`.
4. Now you can use the plugins to manager them. You can read the details in plugins readme page.

```
+-------------+    +-------------+       +------+
| Shadowsocks |    | Shadowsocks |  ...  |      |
| manager API |    | manager API |       |      |
+-------------+    +-------------+       +------+
       |                 |                  |
       |                 |                  |
+-------------+    +-------------+       +------+
| ssmgr       |    | ssmgr       |  ...  |      |
| with type s |    | with type s |       |      |
+-------------+    +-------------+       +------+
       |                 |                  |
       +------------+----+--------  ...  ---+
                    |
                    |
             +---------------+
             | ssmgr plugins |
             |  with type m  |
             +---------------+
```

### Plugins
`[================100%]` [cli](https://github.com/shadowsocks/shadowsocks-manager/blob/master/plugins/cli/README.md)  
`[================100%]` [telegram](https://github.com/shadowsocks/shadowsocks-manager/blob/master/plugins/telegram/README.md)  
`[================100%]` [flowSaver](https://github.com/shadowsocks/shadowsocks-manager/blob/master/plugins/flowSaver/README.md)  
`[================100%]` [email]()  
`[==10%---------------]` [user]()  
`[================100%]` [freeAccount](https://github.com/shadowsocks/shadowsocks-manager/blob/master/plugins/freeAccount/README.md)  
`[0%------------------]` [account]()  
`[1%------------------]` [webgui]()  

### Parameter

`ssmgr --help` will show startup parameters info.

```
Usage: ssmgr [options]

  Options:

    -h, --help                   output usage information
    -V, --version                output the version number
    -c, --config [file]          config file, default: ~/.ssmgr/default.yml
    -d, --db [file]              sqlite3 file, default: ~/.ssmgr/db.sqlite
    -e, --empty                  clean database
    -t, --type [type]            manager type, s for server side, m for manager side, default: s
    -s, --shadowsocks [address]  ss-manager address, default: 127.0.0.1:6001
    -m, --manager [address]      manager address, default: 127.0.0.1:6002
    -p, --password [password]    manager password, both server side and manager side must be equals
    -r, --run [type]             run shadowsocks from child_process, the type is libev or python
    --debug                      show debug message
```

### Donate
If you find this project helpful, please consider making a donation:  

* Alipay  
<img src="https://github.com/gyteng/gyteng.github.com/raw/master/media/pic/alipay.jpg" width="160">

* Wechat  
<img src="https://github.com/gyteng/gyteng.github.com/raw/master/media/pic/wechat.png" width="160">
