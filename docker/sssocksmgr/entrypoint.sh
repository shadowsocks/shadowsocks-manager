#!/bin/bash

sed -i -e "s/MANAGER_PASSWORD/$MANAGER_PASSWORD/g" /root/.ssmgr/ssmgr.yml && \
  sed -i -e "s/MANAGER_DB_HOST/$MANAGER_DB_HOST/g" /root/.ssmgr/ssmgr.yml && \
  sed -i -e "s/MANAGER_DB_USER/$MANAGER_DB_USER/g" /root/.ssmgr/ssmgr.yml && \
  sed -i -e "s/MANAGER_DB_PASSWORD/$MANAGER_DB_PASSWORD/g" /root/.ssmgr/ssmgr.yml && \
  sed -i -e "s/MANAGER_DB_NAME/$MANAGER_DB_NAME/g" /root/.ssmgr/ssmgr.yml && \
  sed -i -e "s/SS_PROXY_ADDRESS/$SS_PROXY_ADDRESS/g" /root/.ssmgr/ssmgr.yml && \
  sed -i -e "s/SS_PROXY_PORT/$SS_PROXY_PORT/g" /root/.ssmgr/ssmgr.yml && \

/usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf