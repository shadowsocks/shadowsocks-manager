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
    ```

3. Start `ssmgr` with type m, and you can talk to your bot to control it.  
    `ssmgr -t m -m yourHost:yourPort`

## Command

### Auth

* `auth` Set manager user, the first user send 'auth' to bot will be the manager.

### Help

* `help` Show help message

### Port

* `list` Show port and password in current server
* `del {port}` Delete port
* `add {port} {password}` Add port and set password
* `pwd {port} {password}` Change password

### Server

* `listserver`
* `switchserver {id}`
* `delserver {name}`
* `addserver {name} {host} {port} {password}`
* `editserver {id} {name} {host} {port} {password}`

### Flow

* `flow`
* `flow{number}min`
* `flow{number}hour`

## Screenshot

### List

![Telegram01](https://github.com/shadowsocks/shadowsocks-manager/blob/master/plugins/telegram/screenshot/telegram01.png)

### Flow

![Telegram02](https://github.com/shadowsocks/shadowsocks-manager/blob/master/plugins/telegram/screenshot/telegram02.png)
