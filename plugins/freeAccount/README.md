# freeAccount plugin

This plugin creates a website to share shadowsocks, everyone can verify their email to get an account.

## Usage

Create config file `~/.ssmgr/free.yml`:

```
type: m
empty: false

shadowsocks:
  address: 127.0.0.1:6001

manager:
  address: 127.0.0.1:6002
  password: '123456'

plugins:
  flowSaver:
    use: true
  email:
    use: true
    username: 'username'
    password: 'password'
    host: 'smtp.your-email.com'
  freeAccount:
    use: true
    host: 'yourhost'
    port: 80
    managerPassword: '01020304'
    shadowsocks:
      method: aes-256-cfb
      startPort: 55000
      endPort: 65000
      flow: 100
      time: 60
    limit:
      user:
        day: 0
        week: 0
        month: 0
      global:
        day: 0
        week: 0
        month: 0

db: 'free.sqlite'
```

run `ssmgr -c free`, and you can visit the website.

## Screenshot

![FreeAccount00](https://github.com/shadowsocks/shadowsocks-manager/blob/master/plugins/freeAccount/screenshot/freeAccount00.png)

![FreeAccount01](https://github.com/shadowsocks/shadowsocks-manager/blob/master/plugins/freeAccount/screenshot/freeAccount01.png)

![FreeAccount02](https://github.com/shadowsocks/shadowsocks-manager/blob/master/plugins/freeAccount/screenshot/freeAccount02.png)

## Demo

[http://free.gyteng.com](http://free.gyteng.com)
