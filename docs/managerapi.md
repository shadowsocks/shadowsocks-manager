# manager API

shadowsocks 的 manager API 可以[参考官方文档](https://github.com/shadowsocks/shadowsocks/wiki/Manage-Multiple-Users)，采用`UDP`协议，指令比较简单，以

`command[: JSON data]`

为格式发送指令，可添加端口、删除端口、返回流量信息。由于这个接口设计过于简单，所以需要运行一个前置系统用于更加复杂、容错的设计。