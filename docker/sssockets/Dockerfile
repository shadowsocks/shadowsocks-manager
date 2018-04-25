FROM ubuntu:16.04
RUN apt-get update && \
    apt-get install tzdata net-tools curl git sudo software-properties-common python-pip iputils-ping -y && \
    pip install git+https://github.com/shadowsocks/shadowsocks.git@master && \
    add-apt-repository ppa:max-c-lv/shadowsocks-libev -y && \
    curl -sL https://deb.nodesource.com/setup_6.x | bash - && \
    apt-get install -y nodejs shadowsocks-libev && \
    npm i -g shadowsocks-manager && \
    echo "Asia/Shanghai" > /etc/timezone && \
    rm /etc/localtime && \
    dpkg-reconfigure -f noninteractive tzdata

WORKDIR /

COPY entrypoint.sh /entrypoint.sh

EXPOSE 6001:6001/udp
EXPOSE 50000-50010:50000-50010

ENTRYPOINT ["/entrypoint.sh"]