FROM mysql:5.7

ADD ./mysql.cnf /etc/mysql/conf.d/mysql.cnf
ADD ./init_ssmgr.sql /docker-entrypoint-initdb.d/init_ssmgr.sql
ADD ./init_webgui.sql /docker-entrypoint-initdb.d/init_webgui.sql