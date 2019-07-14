[![NPM version][npm-image]][npm-url]
[![npm license][license-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/shadowsocks-manager.svg?style=flat-square
[npm-url]: https://npmjs.org/package/shadowsocks-manager
[download-url]: https://npmjs.org/package/shadowsocks-manager
[license-image]: https://img.shields.io/npm/l/shadowsocks-manager.svg

# shadowsocks-manager

A shadowsocks manager tool for multi user and traffic control.  
Base on Node.js and SQLite.

For more details, you can see [docs](https://shadowsocks.github.io/shadowsocks-manager/).

If you want to use the old version, please switch to [this branch](https://github.com/shadowsocks/shadowsocks-manager/tree/version1).

## WebGUI Demo:

[https://shadowghost.app](https://2young.2simple.dev)

## FreeAccount Demo:

[https://free.gyteng.com](https://free2.gyteng.com)


## Dependencies

* Node.js 10.*
* Redis

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
You may need to use the `--unsafe-perm` flag if you receive an permission error
```
npm i -g shadowsocks-manager --unsafe-perm
```
use `ssmgr` to run this program.

### From docker:
```
docker run --name ssmgr -idt -v ~/.ssmgr:/root/.ssmgr --net=host gyteng/ssmgr [ssmgr params...]
```

### Build docker image:

here is the `Dockerfile`

```
FROM ubuntu:18.04
MAINTAINER gyteng <igyteng@gmail.com>
RUN apt-get update && \
    export DEBIAN_FRONTEND=noninteractive && \
    apt-get install tzdata iproute2 curl git sudo software-properties-common python-pip -y && \
    pip install git+https://github.com/shadowsocks/shadowsocks.git@master && \
    curl -sL https://deb.nodesource.com/setup_8.x | bash - && \
    apt-get install -y nodejs shadowsocks-libev && \
    npm i -g shadowsocks-manager --unsafe-perm && \
    echo "Asia/Shanghai" > /etc/timezone && \
    rm /etc/localtime && \
    dpkg-reconfigure -f noninteractive tzdata
CMD ["/usr/bin/ssmgr"]
```

### Usage
1. Start shadowsocks with [manager API](https://github.com/shadowsocks/shadowsocks/wiki/Manage-Multiple-Users), it supports `shadowsocks-python` and `shadowsocks-libev`.
For example, you can run this command:  
```
ss-manager -m aes-256-cfb -u --manager-address 127.0.0.1:6001
 or
ssserver -m aes-256-cfb -p 12345 -k abcedf --manager-address 127.0.0.1:6001
```
2. run ssmgr with type s:

  config file:  
  ```
  type: s

  shadowsocks:
    address: 127.0.0.1:6001
  manager:
    address: 0.0.0.0:4001
    password: '123456'
  db: 'ss.sqlite'
  ```

  If you want to use MySQL, the `db` must like this:

  ```
  db:
    host: '1.1.1.1'
    user: 'root'
    password: 'abcdefg'
    database: 'ssmgr'
  ```

  And you have to close `only_full_group_by` when the version of MySQL is greater than 5.7

  command:  
  `ssmgr -c /your/config/file/path.yml`

3. If you have several servers, you have to run step 1 and step 2 in every server.  
The listening address in `--manager-address` of step 1 and in `shadowsocks -> address` of step 2's config file must be same. For security reseon, we recommend you to use `127.0.0.1` instead of `0.0.0.0`.
4. Now you can use the plugins to manage them. You can read the details in plugins readme page.

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

[telegram](https://github.com/shadowsocks/shadowsocks-manager/blob/master/plugins/telegram/README.md)  
[freeAccount](https://github.com/shadowsocks/shadowsocks-manager/blob/master/plugins/freeAccount/README.md)  
[webgui](https://github.com/shadowsocks/shadowsocks-manager/blob/master/plugins/webgui/README.md)  

### Parameter

`ssmgr --help` will show startup parameters info.

```
Usage: ssmgr [options]

  Options:

    -h, --help                   output usage information
    -V, --version                output the version number
    -c, --config [file]          config file, default: ~/.ssmgr/default.yml
    -d, --db [file]              sqlite3 file, sample: ~/.ssmgr/db.sqlite
    -t, --type [type]            type, s for server side, m for manager side
    -s, --shadowsocks [address]  ss-manager address, sample: 127.0.0.1:6001
    -m, --manager [address]      manager address, sample: 0.0.0.0:6002
    -p, --password [password]    manager password, both server side and manager side must be equals
    -r, --run [type]             run shadowsocks from child_process, sample: libev / libev:aes-256-cfb / python / python:aes-256-cfb
    --debug                      show debug message
```

First, ssmgr will read the config file in `--config`, and other parameters(`-detsmp`) will replace the config file values.

### Translate

If your want to help to translate it to other languages, please edit files [here](https://github.com/shadowsocks/shadowsocks-manager/tree/dev/plugins/webgui/public/translate) and give me a pull request.

### Telegram Group
Join the group if you have some problem: [https://t.me/ssmgr](https://t.me/ssmgr)

### VPS recommendation

* [Linode](https://www.linode.com/?r=bbc24323b3adaf3d74f242fd958d91b55cc6fdea)

* [DigitalOcean](https://m.do.co/c/d43891b79a52)

* [Vultr](https://www.vultr.com/?ref=6926595)

* [AlibabaCloud](https://account-intl.aliyun.com/register/intl_register.htm?biz_params=%7B%22intl%22%3A%22%7B%5C%22referralCode%5C%22%3A%5C%22koa26v%5C%22%7D%22%7D)

* [BandwagonHost](https://bandwagonhost.com/aff.php?aff=19999)

### Donate
If you find this project helpful, please consider making a donation:  

* Alipay  
<img src="https://github.com/gyteng/gyteng.github.com/raw/master/media/pic/alipay.jpg" width="160">

* WeChat Pay  
<img src="https://github.com/gyteng/gyteng.github.com/raw/master/media/pic/wechat.png" width="160">

* Paypal  
[Donate link](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=8UQZLYGCTSLGQ&source=url)
