# webgui_autoban plugin

```
type: m
manager:
  address: 1.2.3.4:5678
  password: 'pwd'

plugins:
  webgui_autoban:
    use: true
    speed: 10
    data:
    - accountId: '1,2,3-10,20,50-60'
      serverId: '1,2-5,11,19'
      time: 1800000
      flow: 100000000
      banTime: 600000
    - accountId: '30'
      serverId: '40'
      time: '30m'
      flow: '0.5g'
      banTime: '10m'

db:
  host: '1.2.3.4'
  user: 'u'
  password: 'pwd'
  database: 'ssmgr'
```