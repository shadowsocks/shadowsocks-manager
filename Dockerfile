FROM node:10-alpine

RUN apk --no-cache add tzdata python  && \
    ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone

ADD package.json /ssmgr/package.json
ADD package-lock.json /ssmgr/package-lock.json
ADD .npmignore /ssmgr/.npmignore
ADD .eslintignore /ssmgr/.eslintignore
ADD .eslintrc.json /ssmgr/.eslintrc.json
ADD gulpfile.js /ssmgr/gulpfile.js
ADD server.js /ssmgr/server.js
ADD bin /ssmgr/bin
ADD init /ssmgr/init
ADD models /ssmgr/models
ADD services /ssmgr/services
ADD plugins /ssmgr/plugins

RUN cd /ssmgr && npm i -g && rm -rf /ssmgr

EXPOSE 80
VOLUME ["/root/.ssmgr"]
ENTRYPOINT ["/usr/bin/ssmgr", "--multiCore"]
