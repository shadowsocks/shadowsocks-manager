# telegram plugin

This plugin can control shadowsocks through a telegram bot.

## Usage

1. Create a telegram bot with [BotFather](https://telegram.me/BotFather). He will give you a token for the bot.

2. Edit config file to use telegram plugin:

    ```
    plugins:
      telegram:
        token: '12345678:********************'
        use: true
      flowSaver:
        use: true
    ```

3. Start `ssmgr` with type m, and you can talk to your bot to control it.  
    `ssmgr -t m -m yourHost:yourPort`

## Command

* `help` Show help message
* `list` Show port and password in current server
* `del {port}` Delete port
* `add {port} {password}` Add port and set password
* `pwd {port} {password}` Change password
