# 安装

## 普通方式

1. 安装 shadowsocks

  可以采用`libev`或`python`版本

2. 安装 Node.js 10.*

  建议使用[`nodesource`](https://github.com/nodesource/distributions)里边的方式安装

3. 安装 Redis 并设置密码

  参考[这个网址](https://www.digitalocean.com/community/tutorials/how-to-install-and-secure-redis-on-ubuntu-18-04)

4. 安装 ssmgr

  ```shell
npm i -g shadowsocks-manager
```

  若出现权限相关的错误提示，则需要尝试：

  ```shell
sudo npm i -g shadowsocks-manager --unsafe-perm
```

  安装完成后，使用`ssmgr`命令来运行程序

## Docker 方式

1. 安装 Docker

  参见[Docker官网](https://docs.docker.com/install/)。

2. 运行

  ```shell
docker run --name ssmgr -idt --net=host \
       -v ~/.ssmgr:/root/.ssmgr \
       gyteng/ssmgr \
       ssmgr -c /your/config/file
```