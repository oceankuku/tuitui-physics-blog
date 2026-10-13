# 主题与素材维护

本站使用灰绿、纸面色与黑板色，角色素材包括头像及 12 种老师动作。

主题变量在 `src/styles/theme.css`，首页和博客共用明暗两套配色。导航头像、分享卡片 Logo、ICO、Apple 图标和 OG 封面使用同一套品牌素材。

站名“颓颓的物理碎碎念”、作者“颓頹老师”和首页内容由 `site.config.mjs` 控制。作品与联系方式未填写时，相关栏目与导航不显示。

## 更新品牌资源

头像原件在 `public/brand/logo-source.png`。`scripts/build-brand.mjs` 从原件派生不同尺寸的图标和分享封面，不覆盖原件。

修改站名、身份、域名或头像后执行：

```bash
npm run brand:build
npm run build
npm run verify
```

检查 `public/brand/og-default.png` 中的文字和头像是否完整，再检查桌面与手机显示。

图标字体使用本地 Font Awesome 6.4.0，许可保存在 `public/vendor/fontawesome/LICENSE.txt`。仅开启微信 SDK 分享时需要加载微信服务。
