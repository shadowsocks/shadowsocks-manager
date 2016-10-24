# shadowsocks-manager

A shadowsocks manager tool for multi user and traffic control.  
Base on Node.js and SQLite.

<font color=#DC143C>This version is not a stable version now.</font>  
If you want to use the old version, please switch to [this branch](https://github.com/shadowsocks/shadowsocks-manager/tree/version1).

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

### Plugins
[cli](https://github.com/shadowsocks/shadowsocks-manager/tree/master/plugins/cli)  
[flowSaver](https://github.com/shadowsocks/shadowsocks-manager/tree/master/plugins/flowSaver)  
[telegram](https://github.com/shadowsocks/shadowsocks-manager/tree/master/plugins/telegram)  

### Usage
1. Start shadowsocks with [manager API](https://github.com/shadowsocks/shadowsocks/wiki/Manage-Multiple-Users), it supports `shadowsocks-python` and `shadowsocks-libev`.
For example, you can run this command:  
`ss-manager -m aes-256-cfb -u --manager-address 127.0.0.1:6001`
2. run ssmgr with type s:  
`ssmgr -t s -s 127.0.0.1:6001 -m 0.0.0.0:6002`
3. If you have several servers, you have to run step 1 and step 2 in every server.
4. Now you can use the plugins to manager them.

### Donate
If you find this project helpful, please consider making a donation:  

* Alipay  
<img src="https://github.com/gyteng/gyteng.github.com/raw/master/media/pic/alipay.jpg" width="160">

* Wechat  
<img src="https://github.com/gyteng/gyteng.github.com/raw/master/media/pic/wechat.png" width="160">
