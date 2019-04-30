FROM node:12-alpine
LABEL maintainer="gyteng <igyteng@gmail.com>"
COPY ./shadowsocks-libev /tmp/repo
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
  && cd /tmp/repo \
  && ./autogen.sh \
  && ./configure --prefix=/usr --disable-documentation \
  && make install \
  && apk del .build-deps \
  && apk add --no-cache \
      rng-tools \
      $(scanelf --needed --nobanner /usr/bin/ss-* \
      | awk '{ gsub(/,/, "\nso:", $2); print "so:" $2 }' \
      | sort -u) \
  && rm -rf /tmp/repo
RUN apk --no-cache add tzdata iproute2 && \
    ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone && \
    npm i -g shadowsocks-manager --unsafe-perm
CMD ["ssmgr"]
