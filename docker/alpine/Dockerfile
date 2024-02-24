FROM node:14-alpine

ENV SS_LIBEV_VERSION=3.3.5
ENV SS_DIR=shadowsocks-libev-${SS_LIBEV_VERSION}

RUN set -ex \
  && apk add --no-cache --virtual .build-deps \
      autoconf \
      automake \
      build-base \
      c-ares-dev \
      libev-dev \
      libtool \
      libsodium-dev \
      linux-headers \
      mbedtls-dev \
      pcre-dev \
      curl \
      tar \
  && cd /tmp \
  && curl -SL -k https://github.com/shadowsocks/shadowsocks-libev/releases/download/v${SS_LIBEV_VERSION}/shadowsocks-libev-${SS_LIBEV_VERSION}.tar.gz | tar xz \
  && cd $SS_DIR \
  && autoreconf --install --force \
  && ./configure --prefix=/usr --disable-documentation \
  && make install \
  && apk del .build-deps \
  && apk add --no-cache \
      rng-tools \
      $(scanelf --needed --nobanner /usr/bin/ss-* \
      | awk '{ gsub(/,/, "\nso:", $2); print "so:" $2 }' \
      | sort -u) \
  && rm -rf /tmp/* \
  && rm -rf /var/cache/apk/*


RUN apk --no-cache add tzdata iproute2 && \
    ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Europe/Moscow" > /etc/timezone && \
    npm i -g shadowsocks-manager --unsafe-perm

CMD ["ssmgr"]