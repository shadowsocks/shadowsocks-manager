# cli plugin

## Summary

This plugin provides a command line tool to control shadowsocks.

## Usage

#### Without flowSaver

If you only have one shadowsocks server and you don't need to count the flows:

1. Edit config file like this:

    ```
    plugins:
      cli:
        use: true
    ```

2. Start ssmgr with type m:  
    `ssmgr -t m -m yourHost:yourPort`

3. Menu like this:

    ```
    Main menu
      |-- add port
      \-- list port
            |-- Delete port
            \-- Change password
    ```

#### With flowSaver

If you have more than one shadowsocks server or you have to count the flows, you need to start with flowSaver plugin:

1. Edit config file like this:

    ```
    plugins:
      cli:
        use: true
      flowSaver:
        use: true
    ```

2. Start ssmgr with type m:  
    `ssmgr -t m -m yourHost:yourPort`

3. Menu like this:

    ```
    Main menu
      |-- add port
      |-- list port
      |     |-- Delete port
      |     \-- Change password
      |-- add server
      |-- list server
      |     |-- Switch to it
      |     |-- Delete server
      |     \-- Edit server
      \-- flow
            |-- 5 mins
            |-- 1 hour
            \-- 24 hours
    ```

## Screenshot

![cli01](https://github.com/shadowsocks/shadowsocks-manager/blob/master/plugins/cli/screenshot/cli01.png)

![cli02](https://github.com/shadowsocks/shadowsocks-manager/blob/master/plugins/cli/screenshot/cli02.png)
