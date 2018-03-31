# webgui plugin

This plugin provide a webgui to control shadowsocks.

## Demo

[https://wall.gyteng.com](https://wall.gyteng.com)

## Usage
1. Make sure your have read the usage according the [main readme page](https://github.com/shadowsocks/shadowsocks-manager/blob/master/README.md).

2. Create a config file in `~/.ssmgr/webgui.yml`:

    ```
    type: m

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
      macAccount:
        use: true
      group:
        use: true
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
        # cdn: 'http://xxx.xxx.com'
        # icon: 'icon.png'
        # skin: 'default'
        # googleAnalytics: 'UA-xxxxxxxx-x'
        gcmSenderId: '456102641793'
        gcmAPIKey: 'AAAAGzzdqrE:XXXXXXXXXXXXXX'
      # alipay:
      #   use: true
      #   appid: 2015012104922471
      #   notifyUrl: 'http://yourwebsite.com/api/user/alipay/callback'
      #   merchantPrivateKey: 'xxxxxxxxxxxx'
      #   alipayPublicKey: 'xxxxxxxxxxx'
      #   gatewayUrl: 'https://openapi.alipay.com/gateway.do'
      # webgui_telegram:
      #   use: true
      #   token: '191374681:AAw6oaVPR4nnY7T4CtW78QX-Xy2Q5WD3wmZ'
      # paypal:
      #   use: true
      #   mode: 'live' # sandbox or live
      #   client_id: 'At9xcGd1t5L6OrICKNnp2g9'
      #   client_secret: 'EP40s6pQAZmqp_G_nrU9kKY4XaZph'

    db: 'webgui.sqlite'
    ```

3. Start `ssmgr` with the config file:
    `ssmgr -c webgui.yml`

4. Open `http://yourwebsite.com`, the first register user will be the manager.

## Screenshot

![Webgui01](https://github.com/shadowsocks/shadowsocks-manager/blob/master/plugins/webgui/screenshot/01.png)  
![Webgui02](https://github.com/shadowsocks/shadowsocks-manager/blob/master/plugins/webgui/screenshot/02.png)  
![Webgui03](https://github.com/shadowsocks/shadowsocks-manager/blob/master/plugins/webgui/screenshot/03.png)  
![Webgui04](https://github.com/shadowsocks/shadowsocks-manager/blob/master/plugins/webgui/screenshot/04.png)  
![Webgui05](https://github.com/shadowsocks/shadowsocks-manager/blob/master/plugins/webgui/screenshot/05.png)  
