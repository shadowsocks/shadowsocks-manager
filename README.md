Fork From [Shadowsocks-Manager](https://github.com/shadowsocks/shadowsocks-manager)

## For Custom Modification

+ 主页Title修改
+ 主页图片修改


>ssmgr启动，当以 server.js 方式启动时，务必切换到shadowsocks-manager目录下
使用pm2启动：
```
cd /xxx/shadowsocks-manager/
pm2 --name "ss" -f start server.js  --  -c xxx/.ssmgr/ss.yml
pm2 --name "webgui" -f start server.js  --  -c xxx/.ssmgr/webgui.yml
```