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
