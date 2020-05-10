# Trojan 节点

虽然项目名称为`shadowsocks-manager`，同样支持 Trojan 做节点

## 安装 trojan

可选如下3个项目：

* [p4gefau1t/trojan-go](https://github.com/p4gefau1t/trojan-go)
* [trojan-gfw/trojan](https://github.com/trojan-gfw/trojan)
* [DenrianWeiss/trojan-cluster](https://github.com/DenrianWeiss/trojan-cluster)

## 安装 MySQL 或 Redis

## 安装 s 端

使用[ssmgr-trojan-client](https://github.com/llc1123/ssmgr-trojan-client)作为 s 端，安装并运行

```
npm i -g ssmgr-trojan-client
ssmgr-trojan-client -k yourpassword
```