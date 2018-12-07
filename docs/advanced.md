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
      proxy_set_header  X-Real-IP        $remote_addr;
      proxy_set_heade   Host             $http_host;
      proxy_set_header  X-Frame-Options  DENY;
      proxy_pass        http://127.0.0.1:8080;
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

