FROM ubuntu:18.04
MAINTAINER gyteng <igyteng@gmail.com>
RUN apt-get update && \
    export DEBIAN_FRONTEND=noninteractive && \
    apt-get install tzdata iproute2 curl git sudo software-properties-common python-pip -y && \
    pip install git+https://github.com/gyteng/shadowsocks.git@master && \
    curl -sL https://deb.nodesource.com/setup_12.x | bash - && \
    apt-get install -y nodejs shadowsocks-libev && \
    npm i -g shadowsocks-manager --unsafe-perm && \
    echo "Asia/Shanghai" > /etc/timezone && \
    rm /etc/localtime && \
    dpkg-reconfigure -f noninteractive tzdata
CMD ["/usr/bin/ssmgr"]
