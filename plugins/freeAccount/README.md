# freeAccount plugin

This plugin creates a website to share shadowsocks for free.

## Usage

### Quick start with docker

1. Make a config folder, and create file `default.yml` `free.yml` in it:

    ```
    default.yml:

    type: s
    shadowsocks:
      address: 127.0.0.1:6001
    manager:
      address: 127.0.0.1:6002
      password: '123456'
    db: 'db.sqlite'

    --------------------

    free.yml:

    type: m
    manager:
      address: 127.0.0.1:6002
      password: '123456'
    plugins:
      freeAccount:
        use: true
        port: 12345
        # port value can be a range: '1000-2000,2003,2005-2009'
        flow: 500000000
        # or 500M, 500K, 500G
        time: 3600000
        # or 30m, 2h
        address: 'free.ssmgr.top'
        method: 'aes-256-cfb'
        listen: '0.0.0.0:80'
    db: 'free.sqlite'
    ```

2. run this command, the ports depends on your `free.yml` file:

    ```
    docker run --name types -idt -v /your/config/file/path:/root/.ssmgr --net=host gyteng/ssmgr ssmgr -c default.yml -r
    docker run --name typem -idt -v /your/config/file/path:/root/.ssmgr --net=host gyteng/ssmgr ssmgr -c free.yml
    ```

### Start in normal way

1. Start `ssmgr` with type s, you can read the guide [here](https://github.com/shadowsocks/shadowsocks-manager).

2. Create config file `~/.ssmgr/free.yml`:

    ```
    type: m
    manager:
      address: 127.0.0.1:6002
      password: '123456'
    plugins:
      freeAccount:
        use: true
        port: 12345
        # port value can be a range: '1000-2000,2003,2005-2009'
        flow: 500000000
        time: 3600000
        address: 'free.ssmgr.top'
        method: 'aes-256-cfb'
        listen: '0.0.0.0:80'
    db: 'free.sqlite'
    ```

3. run `ssmgr -c free.yml`, and you can visit the website.

## Demo

[http://free.ssmgr.top](http://free.ssmgr.top)