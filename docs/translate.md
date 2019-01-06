# 翻译

web 界面还有诸多地方没有翻译完整，想要协助翻译可参考本文。

多语言支持采用了[angular-translate](https://angular-translate.github.io/)，对于需要翻译的部分，大致有两种简单的处理方法：

```
<div translate>样例</div>
<div>{{'样例' | translate }}</div>
```

然后编辑`/plugin/webgui/public/translate/en-US.js`添上对应的翻译结果即可：

```
module.exports = {
  '样例': 'Sample',
};
```