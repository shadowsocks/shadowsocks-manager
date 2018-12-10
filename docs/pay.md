# 支付

## 支付宝

1. 申请当面付接口

  成功申请后需要到蚂蚁金服开放平台中“PID和公钥管理”的开放平台密钥对你生成的应用进行密钥设置，格式必须为“RSA2(SHA256)”

2. 生成密钥

  建议使用支付宝提供的“RSA签名验签工具”生成应用密钥，格式请选择**PKCS1（非JAVA适用）**

3. 添加相应配置

```yaml
plugins:
  alipay:
    use: true
    appid: 2015012108272442
    notifyUrl: 'http://yourwebsite.com/api/user/alipay/callback'
    merchantPrivateKey: '/merchant/private/key'
    alipayPublicKey: '/alipay/public/key'
    gatewayUrl: 'https://openapi.alipay.com/gateway.do'
```
!> `merchantPrivateKey`和`alipayPublicKey`这两个字段内容，可以填写key的路径，也可以填写key的内容

## Paypal

  申请Paypal商家号，添加一个`REST API`，将 id 和 secret 填入配置文件即可

```yaml
plugins:
  paypal:
    use: true
    mode: 'live' # sandbox or live
    client_id: 'At9xcGd1t5L6OrICKNnp2g9'
    client_secret: 'EP40s6pQAZmqp_G_nrU9kKY4XaZph'
```