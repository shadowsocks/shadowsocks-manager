FROM ubuntu:18.04
LABEL maintainer="Gyteng <igyteng@gmail.com>"
RUN apt-get update && \
    export DEBIAN_FRONTEND=noninteractive && \
    apt-get install tzdata iproute2 curl wget git sudo software-properties-common python-pip -y && \
    pip install git+https://github.com/gyteng/shadowsocks.git@master && \
    curl -sL https://deb.nodesource.com/setup_12.x | bash - && \
    apt-get install -y nodejs shadowsocks-libev && \
    npm i -g shadowsocks-manager --unsafe-perm && \
    cd /tmp && \
    wget https://github.com/shadowsocks/shadowsocks-rust/releases/download/v1.8.10/shadowsocks-v1.8.10-stable.x86_64-unknown-linux-musl.tar.xz && \
    xz -d shadowsocks-v1.8.10-stable.x86_64-unknown-linux-musl.tar.xz && \
    tar -xvf shadowsocks-v1.8.10-stable.x86_64-unknown-linux-musl.tar && \
    mv /tmp/ssmanager /usr/bin/ && \
    rm -rf /tmp/* && \
    echo "Asia/Shanghai" > /etc/timezone && \
    rm /etc/localtime && \
    dpkg-reconfigure -f noninteractive tzdata
CMD ["/usr/bin/ssmgr"]
