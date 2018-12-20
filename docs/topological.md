# 拓扑图

ssmgr 利用 shadowsocks 的 manager API 工作，支持`python`和`libev`版本。假设有 n 台服务器，每台服务器上均需要安装 shadowsocks，然后启动一个 ssmgr，配置文件里的 type 一栏填上 s，代表这是 shadowsocks 的前置系统，然后再开启一个 plugin，即可管理这 n 台服务器上的 shadowsocks 了，如下图所示：

```
+-------------+    +-------------+       +------+
| Shadowsocks |    | Shadowsocks |  ...  |      |
| manager API |    | manager API |       |      |
+-------------+    +-------------+       +------+
       |                 |                  |
       |                 |                  |
+-------------+    +-------------+       +------+
| ssmgr       |    | ssmgr       |  ...  |      |
| with type s |    | with type s |       |      |
+-------------+    +-------------+       +------+
       |                 |                  |
       +------------+----+--------  ...  ---+
                    |
                    |
             +---------------+
             | ssmgr plugins |
             |  with type m  |
             +---------------+
```