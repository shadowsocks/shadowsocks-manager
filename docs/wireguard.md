# WireGuard 节点

虽然项目名称为`shadowsocks-manager`，同样支持 WireGuard 做节点

## 安装 WireGuard

```shell
sudo add-apt-repository ppa:wireguard/wireguard
sudo apt update
sudo apt install wireguard -y
```

!> Web 端也需要安装

## 配置路由表

假设网卡名为`ens3`

```
sudo iptables -t filter -A FORWARD -i wg0 -j ACCEPT
sudo iptables -t filter -A FORWARD -o wg0 -m state --state RELATED,ESTABLISHED -j ACCEPT
sudo iptables -A FORWARD -i wg0 -o ens3 -j ACCEPT
sudo iptables -A FORWARD -i ens3 -o wg0 -m state --state ESTABLISHED,RELATED -j ACCEPT
sudo iptables -t nat -A POSTROUTING -o ens3 -j MASQUERADE
```

## 开启转发功能

```
echo 1 >/proc/sys/net/ipv4/ip_forward
```

## 生成密钥

```shell
wg genkey > privatekey
wg pubkey < privatekey > publickey
```
其中 private key 写在配置文件里，public key 在 web 端增加服务器时填写

## 增加配置文件

```
[Interface]
Address = 10.100.0.1/16 
PrivateKey = 8REGzY7PA3p81VN9KQ4mKM7d8oFZBu2wD7Pbs8ppPkW= 
ListenPort = 50000
```

## 启动 WireGuard

```shell
sudo wg-quick up ./wg0.conf
```

## 启动 s 端

使用[此项目](https://github.com/gyteng/shadowsocks-manager-wireguard)作为 s 端即可
```
node index --gateway 10.100.0.1 \
           --manager 0.0.0.0:6789 \
           --password 123456 \
           --interface wg0 \
           --db /your/data.json
```