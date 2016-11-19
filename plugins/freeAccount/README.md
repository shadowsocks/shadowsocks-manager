# freeAccount plugin

This plugin creates a website to share shadowsocks, everyone can verify their email to get an account.

## Usage

### Quick start with docker

1. Make a config folder, and create file `default.yml` `free.yml` in it:

    ```
    default.yml:

    type: s
    empty: false
    shadowsocks:
      address: 127.0.0.1:6001
    manager:
      address: 127.0.0.1:6002
      password: '123456'
    db: 'db.sqlite'

    --------------------

    free.yml:

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
          endPort: 56000
          flow: 500
          time: 180
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

2. run this command, the ports depends on your `free.yml` file:

    ```
    docker run -idt --name ssmgrfa\
    -p 80:80\
    -p 55000-56000:55000-56000\
    -v {your-config-folder-path}:/root/.ssmgr\
    gyteng/ssmgrfa

    docker exec -it ssmgrfa sh /root/start.sh
    ```

### Start in normal way

1. Start `ssmgr` with type s, you can read the guide [here](https://github.com/shadowsocks/shadowsocks-manager).

2. Create config file `~/.ssmgr/free.yml`:

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

3. run `ssmgr -c free.yml`, and you can visit the website.

## Screenshot

![FreeAccount00](https://github.com/shadowsocks/shadowsocks-manager/blob/master/plugins/freeAccount/screenshot/freeAccount00.png)

![FreeAccount01](https://github.com/shadowsocks/shadowsocks-manager/blob/master/plugins/freeAccount/screenshot/freeAccount01.png)

![FreeAccount02](https://github.com/shadowsocks/shadowsocks-manager/blob/master/plugins/freeAccount/screenshot/freeAccount02.png)

## Demo

[http://free.gyteng.com](http://free.gyteng.com)
