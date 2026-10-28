# 公众号复制与微信分享

## 复制到公众号

文章页按钮将正文与标题、摘要、作者和日期复制为 HTML 富文本和纯文本，内联当前页面样式。图片转 base64 内嵌（data URI），代码与表格调整为适合窄栏的换行方式。

此功能不需要公众号 AppId 或签名。建议在 localhost 或 HTTPS 下操作；剪贴板不可用时组件尝试兼容复制。微信编辑器可能过滤部分样式或要求重新上传图片，粘贴后仍需预览检查，不能保证第三方编辑器完全保留所有样式。

当前配置域名为 `https://imkuku.me`（2026-10-27 站主确认，site.config.mjs 默认值已同步；如需更换域名，改 site.config.mjs 并设置 Cloudflare 环境变量 SITE_URL）。

## 复制管线铁律（2026-10-17 审计定稿，改复制逻辑必读）

微信编辑器粘贴时做"白名单"清洗，以下规则全部来自实测踩坑。

### 引用块 300 字上限（2026-10-28）

公众号编辑器的引用（blockquote）样式**单个引用块不能超过 300 字**，超过无法发表。选中题目用「复制引用」时，组件自动按段落与句子边界把超长选段拆成多个 ≤280 字的连续引用块（`QUOTE_LIMIT` 常量，SelectionShare.astro `splitLongQuote`），拆分提示随出处一并复制。**改拆分逻辑前先实测公众号引用上限是否仍为 300 字；不要把多个引用块手工合并回去。****改 `src/pages/blog/[slug].astro` 里 `buildWechatRichText` 的任何逻辑前先读完这一节**：

### 标签白名单（三条）

1. **禁止 `<header>`**：粘贴白名单里没有这个标签，会被整个剥壳——标签身上的下边框、间距全部丢失。标题块必须用 `<section>`（2026-10-17 修复：标题分隔线每次粘贴都消失的根因）。
2. **禁止 `<div>`**：div 标签本身会被剥掉，内容保留、标签上的样式全丢。公式块外层的 div 只能当可剥离的外壳，**每一行公式必须由自带完整样式的 `<p>` 承载**。smoke 断言复制产物里不得出现 `<div`。
3. **可用标签**：`section`（公众号编辑器原生容器，粘贴安全）、`p`、`span`、`h1`-`h4`、`blockquote`、`ul/ol/li`、`table`、`img`。

### 样式白名单（三条）

4. **flex 系全部被洗**：`display:flex/inline-flex`、`flex-direction` 粘贴后消失，分子分母会变左右并排。分数必须用 `inline-block` 外层 + 块级（`display:block`）分子分母。
5. **`currentColor` 会被洗成无效值**：分数线、根号上划线等关键颜色必须写死具体色值（从 CSS 变量取值后内联），不能引用变量或 currentColor。
6. **样式必须逐元素内联**：粘贴时 `<style>` 块和 class 全部丢弃，每个元素的每个视觉属性必须写在自身 `style` 里（含 `font-family`——没写的元素会被微信套编辑器默认字体，视觉不统一）。

### 开发纪律（两条）

7. **file:// 打开 dist 会出现 CSS 变量为空的假象**（`getPropertyValue` 返回空串），审计复制产物必须走 http。本地验证用 `scripts/static-server.mjs` 起服务后再在页面里调 `window.buildWechatRichText()`。
8. **改复制逻辑必须跑 `npm run test:smoke`**，且验证要用干净 build 的 dist（dev server 缓存旧模块会误导排查）。smoke 已覆盖：分数竖式、根号上划线、公式行 p 承载、表格固定布局、禁止 header/div 标签。

## 微信内自定义分享卡片（可选）

普通链接已经带 OG 元数据。若希望微信内右上角分享使用指定标题、摘要和封面：

1. 使用站主自己的公众号和真实站点域名配置。
2. 在 `site.config.mjs` 中开启 `wechat.enabled`，指定 `signUrl`。
3. 部署服务端签名接口。项目提供 `functions/api/wx-sign.js` 作为 Cloudflare Pages 可选模板。
4. 只在服务端设置 `WX_APPID`、`WX_APPSECRET`，不要写入站点配置、Markdown、前端或 ZIP。
5. 完成微信公众号的域名与接口权限配置，并在真实微信环境测试。

提供的签名函数只允许当前请求同源页面或 `WX_SITE_ORIGIN` 指定来源，不接受任意外部 URL。普通静态托管不会执行这个函数；不需要微信定制分享时可以忽略它。

浏览器冒烟检查覆盖复制功能；微信内自定义分享需在真实微信环境单独验收。
