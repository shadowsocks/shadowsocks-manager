# 安装

## 普通方式

### 安装shadowsocks

可以采用`libev`或`python`版本。

### 安装Node.js

版本：`8.x`，建议使用[`nodesource`](https://github.com/nodesource/distributions)里边的方式安装，完成后确认一下版本号：

```shell
$ node -v
v8.14.0
```

### 安装ssmgr

```shell
npm i -g shadowsocks-manager
```
若出现权限相关的错误提示，则需要尝试：
```shell
sudo npm i -g shadowsocks-manager --unsafe-perm
```
安装完成后，使用`ssmgr`命令来运行程序。

## Docker方式

### 安装Docker

参见[Docker官网](https://docs.docker.com/install/)。

### 运行

```shell
docker run --name ssmgr -idt --net=host \
       -v ~/.ssmgr:/root/.ssmgr \
       gyteng/ssmgr \
       ssmgr -c /your/config/file
```