# 高级

## 配合 nginx 使用

若80端口还有别的网站占用，或者需要采用 https 的方式访问，需要先配置`nginx`

把配置文件的 webgui 部分更改为：

```yaml
webgui:
  use: true
  host: '127.0.0.1'
  port: '8080'
  site: 'http://yourwebsite.com'
```

添加 nginx 的配置文件：

```
server {
  listen         80;
  server_name    yourwebsite.com;
  rewrite        ^   https://$server_name$request_uri? permanent;
}
server {  
  listen                 443 ssl http2;
  server_name            yourwebsite.com;
  ssl                    on;
  ssl_certificate        /xxx/chained.pem;
  ssl_certificate_key    /xxx/domain.key;
  location / {
      proxy_set_header   X-Real-IP        $remote_addr;
      proxy_set_header   Host             $http_host;
      proxy_set_header   X-Frame-Options  DENY;
      proxy_pass         http://127.0.0.1:8080;
  }
}
```

## 使用 MySQL

如果想要用 MySQL 替代 SQLite，把配置文件的`db`部分改为：

```yaml
db:
  host: '127.0.0.1'
  port: 3306
  user: 'abc'
  password: 'xxxxx'
  database: 'ooooo'
```

!> 节点端建议采用 SQLite

!> 当使用5.7或更高版本的 MySQL 时，必须关闭`only_full_group_by`这个特性

## 使用 mailgun 发送邮件

将配置文件的 email 部分替换成下面的格式：

```yaml
email:
  use: true
  type: 'mailgun'
  baseUrl: 'https://api.mailgun.net/v3/sandbox31d0f2c9c753a343f2e7c54da78ca89e.mailgun.org'
  apiKey: 'key-f1e6a7558c7c5a37a33fdba53a87ea82'
```

!> mailgun 每月都有一定的免费额度，需绑定信用卡

# 随节点运行 shadowsocks

在 s 端运行`ssmgr`时，只需加上一个`-r`的参数，便可省去运行`ss-manager`的步骤，当然首先系统里需要安装了对应版本的 shadowsocks 才行。默认为运行 libev 版，加密方式 aes-256-cfb：

```shell
ssmgr -c xxx.yml -r
ssmgr -c xxx.yml -r libev
ssmgr -c xxx.yml -r libev:aes-256-gcm
ssmgr -c xxx.yml -r python:aes-256-gcm
```

# 自定义服务器显示地址

有时候，s 端的实际地址跟想要展示给用户的地址不相同，假设原本地址是`1.1.1.1`，想给用户展示`2.2.2.2`，只需在 Web 端编辑服务器，把地址写成`1.1.1.1:2.2.2.2`，这样 m 端实际通信的地址是冒号前面部分，展示给用户的是冒号后面的部分。

# 使用端口偏移功能

在编辑服务器时，默认的“端口偏移”值为0，当这个值不为0的时候（可以是负数），会使该节点所有端口都加上这个偏移量。当需要一台机作为两个节点使用时，用这个参数可以错开端口号避免冲突。

# 自定义首页图标

在配置文件里加上 icon 参数便可指定首页图片，可使用绝对路径或者只填文件名（默认在~/.ssmgr里找），建议图片大小为 256 x 256

```yaml
plugins:
  webgui:
    use: true
    icon: 'icon.png'
```

# 转发 smtp 协议

对于一些不支持 smtp 协议的 VPS，可通过代理转发的方式转到一台支持的 VPS 上面去发邮件，加上一个`proxy`参数即可：

```yaml
plugins:
  email:
    use: true
    type: 'smtp'
    username: 'username'
    password: 'password'
    host: 'smtp.your-email.com'
    proxy: 'socks://127.0.0.1:1234/'
```

# 使用充值码功能

在配置文件中加上 giftcard 插件即可：

```yaml
plugins:
  giftcard:
    use: true
```

# 使用 Telegram Bot

使用该插件后，管理员和用户都能够绑定 Telegram 账号，管理员可以实时收到用户注册和付费提醒，普通用户每天早上可以收到昨日流量统计。

从[@BotFather](https://telegram.me/BotFather)申请一个bot，然后在配置文件中加上 webgui_telegram 插件：

```yaml
webgui_telegram:
  use: true
  token: '191374681:AAw6RaVHR4nnP7T4Ct4a8QX-XyFQ5W53wmZ'
```
