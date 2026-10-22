# 颓颓的物理碎碎念 · 协作规则

本目录是“颓颓的物理碎碎念”高中物理个人站，作者为颓頹老师。首次工作先读 README.md、site.config.mjs；开始文章任务再读 AI_WRITING_GUIDE.md、BLOG_TEMPLATE.md 和 docs/writing-anti-ai-style.md。

## 内容操作

- 日常文章只写入 `src/content/blog/<稳定英文短名>.md`，原图放在 `public/blog-images/<同名目录>/`。
- 站点信息集中修改 `site.config.mjs`。不得根据素材推断站主姓名、联系方式、学历、学生成绩或工作成果。
- 默认 `draft: false`。只有用户要求暂不公开时使用 `draft: true`；未来日期不会自动延迟发布。
- `pubDate` 是真实发布日期；`updatedAt` 只用于实质内容修订。已发布文件名与 URL 保持稳定。
- 不在正文重复 H1，不添加未经确认的事实，不发布原始学生档案或私人材料。
- 图片必须是真实文件。保留原图，不引用 `/_content-images/` 哈希路径；每张图写准确 alt。插图操作规则见 `docs/images.md`。
- 构建自动产生 HTML、Markdown、索引、RSS、sitemap、robots.txt 和 llms.txt。不要手改 `dist/`、缓存或机器入口产物。
- 公众号复制、选段复制/引用、分享图片、文章目录和相邻文章由组件维护。写文章时不要修改这些实现。
- 原始材料放在 `workspace/inbox/`，只读处理。用户只要求写一篇文章时，不顺带重写其他文章或改变站点主题。

## 公式与数学符号渲染标准（MathJax 方案）

**2026-10-22 起公式渲染切换为自托管 MathJax（`tex-mml-chtml.js` 3.2.2），LaTeX 语法，全站 21 篇已改造完毕。** 本节为唯一公式标准，旧 `{a/b}`/`√( )` 语法废止。

- **渲染管线**：文章 frontmatter 加 `mathjax: true` 后，页面加载自托管 MathJax（`public/vendor/mathjax/tex-mml-chtml.js` + CHTML 字体）自动排版 `$$...$$` / `$...$`。`scripts/content-images.mjs` 的 `formulaBlocks` 插件双轨分发：`:::formula` 块含 `\`/`$` 时输出 MathJax 显示公式（`div.mathjax-display`），否则走旧 `.formula-block` 渲染（存量兼容用）。
- **公众号复制**：`buildWechatRichText` 里每个 `mjx-container` 用 `html-to-image`（自托管 `public/vendor/html-to-image/`）栅格化为 2x PNG 内嵌——公众号里公式以图片显示，粘贴安全。
- **Noto Sans Symbols 2 字体兜底保留**：正文叙述里的裸符号（≈、→、²、希腊字母）仍靠它保证跨设备字形一致（`public/fonts/`、`src/styles/noto-symbols2.css`）。

写法约定（完整规则见 `AI_WRITING_GUIDE.md` 第九节）：

- **frontmatter 必须加 `mathjax: true`**；独立公式用 `:::formula` 块直接写 LaTeX（不需 `$`），行内公式用 `$...$`；
- **分数一律竖式 `\frac{分子}{分母}`**，禁斜杠算式（`1200 / 5400` 不许出现在正文）、禁 Unicode 分数（½ 等）、禁旧语法 `{a/b}`、`√( )`；
- 常用语法：下标 `v_0`、上标 `v^2`、中文下标 `v_{\text{末}}`、根号 `\sqrt{2gh}`、极限 `\lim_{\Delta t \to 0}`、乘 `\times`、约等 `\approx`、希腊字母 `\Delta`/`\theta`/`\pi`、三角函数 `\sin^2\theta`；
- **单位不进公式**：m/s、km/h、m/s² 保持纯文本写在 `$...$` 外（`$v = 20$ m/s`）；
- 公式块内不嵌 HTML 标签；变量下标用 `v_R`、中文用 `v_{\text{甲}}`。

硬约束：

- `:::formula` / `:::problem` / `:::answer` / `:::note` 均为围栏容器，**禁止互相嵌套**（尤其 `:::formula` 不能放进 `:::answer`）——这是公众号复制管线（白名单只认 section / p / span / blockquote，剥离 div / flex / currentColor）的前提；改复制逻辑前必读 `docs/wechat.md` 并跑 `npm run test:smoke`。
- **tsconfig.json 的 exclude 必须保留 `public` 与 `workspace`**——否则 `astro check` 会诊断 public/vendor 里的 1.17MB 压缩 JS 导致构建 OOM。

## 完成检查

1. 按自然写作规范通读全文，核对引用、事实、日期、图片路径。
2. 执行 `npm run build` 和 `npm run verify`。失败时修源文件并重跑。
3. 改过页面、复制或图片逻辑时执行 `npm run test:smoke`，并检查桌面与移动端。
4. 告诉用户修改了哪些源文件、预览地址与检查结果。
5. 完成后提交并推送远程（`git push origin main`），Cloudflare Pages 自动构建部署。
6. 完成后关闭自己启动的临时服务。保留用户的其他修改。

## 推送与 npm ci

站点部署在 Cloudflare Pages，构建入口是 `npm ci`。推送前必须保证 `npm ci` 能通过：

- 改过 `package.json` 的依赖（新增/删除/改版本）后，必须先跑 `npm install` 更新 `package-lock.json`，与源码一起提交。
- 推送前可本地快速验证：`npm ci --dry-run`。报 "Missing ... from lock file" 即 lock 不同步。
- 严禁只提交 `package.json` 不提交 `package-lock.json`。

## 目录边界

域名、部署目标和微信公众号配置以用户提供的信息为准，不推断或填入未经确认的账号与密钥。部署说明见 README.md。
