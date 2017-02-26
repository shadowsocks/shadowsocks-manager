# webgui plugin

This plugin provide a webgui to control shadowsocks.

## Usage

1. Create a config file in `~/.ssmgr/webgui.yml`:

    ```
    type: m
    empty: false

    manager:
      address: 127.0.0.1:6002
      password: '123456'

    plugins:
      flowSaver:
        use: true
      user:
        use: true
      account:
        use: true
        pay:
          hour:
            price: 0.03
            flow: 500000000
          day:
            price: 0.5
            flow: 7000000000
          week:
            price: 3
            flow: 50000000000
          month:
            price: 10
            flow: 200000000000
      email:
        use: true
        username: 'username'
        password: 'password'
        host: 'smtp.your-email.com'
      webgui:
        use: true
        host: '0.0.0.0'
        port: '80'
        site: 'http://yourwebsite.com'
      alipay:
        use: true
        appid: 2015012104922471
        notifyUrl: ''
        merchantPrivateKey: 'xxxxxxxxxxxx'
        alipayPublicKey: 'xxxxxxxxxxx'
        gatewayUrl: 'https://openapi.alipay.com/gateway.do'

    db: 'webgui.sqlite'
    ```

2. Start `ssmgr` with the config file:
    `ssmgr -c webgui.yml`

3. Open `http://yourwebsite.com`, the first register user will be the manager.

## Screenshot

![Webgui01](https://github.com/shadowsocks/shadowsocks-manager/blob/master/plugins/webgui/screenshot/01.png)  
![Webgui02](https://github.com/shadowsocks/shadowsocks-manager/blob/master/plugins/webgui/screenshot/02.png)  
![Webgui03](https://github.com/shadowsocks/shadowsocks-manager/blob/master/plugins/webgui/screenshot/03.png)  
![Webgui04](https://github.com/shadowsocks/shadowsocks-manager/blob/master/plugins/webgui/screenshot/04.png)  
![Webgui05](https://github.com/shadowsocks/shadowsocks-manager/blob/master/plugins/webgui/screenshot/05.png)  
