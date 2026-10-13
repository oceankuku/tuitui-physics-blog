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

## 完成检查

1. 按自然写作规范通读全文，核对引用、事实、日期、图片路径。
2. 执行 `npm run build` 和 `npm run verify`。失败时修源文件并重跑。
3. 改过页面、复制或图片逻辑时执行 `npm run test:smoke`，并检查桌面与移动端。
4. 告诉用户修改了哪些源文件、预览地址与检查结果。默认完成本地构建；对外发布按用户实际指令执行。
5. 完成后关闭自己启动的临时服务。保留用户的其他修改。

## 目录边界

域名、部署目标和微信公众号配置以用户提供的信息为准，不推断或填入未经确认的账号与密钥。部署说明见 README.md。
