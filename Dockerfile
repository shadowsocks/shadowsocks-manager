FROM node:14-buster-slim

# Install dependencies and utilities
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y tzdata iproute2 curl git sudo software-properties-common python3-pip && \
    pip3 install git+https://github.com/shadowsocks/shadowsocks.git@master

RUN apt-get update && \
    apt-get install -y nodejs shadowsocks-libev

# Configure timezone
RUN echo "Asia/Tokyo" > /etc/timezone && \
    ln -fs /usr/share/zoneinfo/Asia/Tokyo /etc/localtime && \
    dpkg-reconfigure -f noninteractive tzdata

# Copy the application source
COPY ./ /shadowsocks-manager

# Build the application
RUN cd /shadowsocks-manager && \
    npm install && \
    npm run build

# If you intend to install a package globally, specify the package.
# Example: RUN npm install -g some-global-package

# Set the command to run your application
CMD ["node", "/shadowsocks-manager/bin/ssmgr"]
