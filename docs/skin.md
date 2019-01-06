# 首页皮肤

## 使用自带皮肤

在 webgui 的配置里增加`skin`字段即可使用首页皮肤

```yaml
plugins:
  webgui:
    skin: 'default'
```

目前可以填的值有：

- default
- bing
- fs_bing
- fs_dinosaur
- fs_sample
- fs_zelda

## 创建自定义皮肤

- 在`/plugin/webgui/public/views/skin`目录下创建自己的皮肤文件`yourskin.html`
- 更改配置文件填上皮肤名称

!> 若皮肤名称以 fs_ 开头，则首页会隐藏顶部的导航条