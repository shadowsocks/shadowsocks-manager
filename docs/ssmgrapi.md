# ssmgr API

ssmgr 之间采用 TCP socket 的方式通讯，接口协议如下：

发送：`[2字节 消息长度][6字节时间戳][指令][4字节 校验码]`

返回：`[4字节 消息长度][内容]`

* 列出服务器上的端口和密码

```
{
  command: 'list'
}
[
  { port: 1234, password: '5678'},
  { port: 1235, password: '5678'}
]
```

* 添加端口

```
{
  command: 'add',
  port: 1234,
  password: 'qwer'
}
{
  port: 1234,
  password: 'qwer'
}
```

* 删除端口

```
{
  command: 'del',
  port: 1234
}
{
  port: 1234
}
```

* 修改密码

```
{
  command: 'pwd'
  port: 1234,
  password: 'asdfgh'
}
{
  port: 1234,
  password: 'asdfgh'
}
```

* 查询流量

```
{
  command: 'flow',
  port: 1234,
  options: {
    startTime: 1489137503258,
    endTime: 1489137603258,
    clear: true
  }
}
[
  { port: 1234, sumFlow: 1234 },
  { port: 1235, sumFlow: 1234 }
]
```

* 查询版本号

```
{
  command: 'version'
}
{
  version: 0.9.0
}
```

* 查询客户端连接IP

```
{
  command: 'ip',
  port: 1234
}
[
  '1.1.1.1',
  '2.2.2.2'
]
```