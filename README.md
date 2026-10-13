# 颓颓的物理碎碎念

颓頹老师的高中物理个人站。嘴上碎碎念，手上全是干货：讲模型、捋易错点、拆实验题，专治物理拖后腿。

项目使用 Astro，文章以 Markdown 维护，构建为静态网站。支持文章搜索、标签筛选、阅读目录、Markdown 原文、公众号复制和选段分享卡片。静态素材库位于 `/materials/`，导航中的“素材库”可直接进入。

## 本地运行

需要 Node.js 20.11+、npm 和 Python 3（用于内容校验）。在项目目录执行：

```bash
npm ci
npm run dev
```

默认预览地址为 `http://localhost:4321`，实际地址以终端输出为准。

## 源码包使用

解压后进入 `tuitui-physics-blog` 目录，执行 `npm ci` 安装依赖，再执行 `npm run dev` 打开本地预览。源码包包含全部页面、文章、45 张图片素材，以及 20 张 Hero 横图的提示词和编号预览。

包内不带 `node_modules/`、`dist/`、缓存、测试截图、原始资料或旧版图片备份。`workspace/inbox/` 留空，新的写作资料放入这里。Hero 总览可直接打开 `workspace/image-notes/hero-physics-all-preview.html`，也可启动网站后进入“素材库”。

重新打包运行 `npm run pack`，输出为 `release/tuitui-physics-blog.zip`。

## 站点配置

站名、作者、描述、域名和首页内容统一维护在 `site.config.mjs`。

| 配置 | 用途 |
| --- | --- |
| `name`、`author`、`role` | 颓颓的物理碎碎念、颓頹老师、高中物理 |
| `description`、`blogTitle`、`blogDescription` | 站点与博客列表介绍 |
| `url` | 正式域名，也可通过 `SITE_URL` 环境变量指定 |
| `home` | 首页标题、介绍、角色图和内容方向 |
| `home.projects`、`home.contacts` | 作品和联系方式，未填写时不显示 |
| `wechat` | 微信内自定义分享，当前关闭 |

当前域名为 `https://example.com`。正式发布前填写真实域名；站名、身份或域名修改后，运行 `npm run brand:build` 更新分享封面，再重新构建。

## 写作与图片

```text
src/content/blog/<文章短名>.md        文章正文与 frontmatter
public/blog-images/<文章短名>/       文章原图
workspace/inbox/                     待整理资料，只读
workspace/image-notes/               图片提示词与来源记录
public/site-assets/                 老师立绘
public/material-library/            角色参考、头像与教学素材
```

从 [BLOG_TEMPLATE.md](BLOG_TEMPLATE.md) 起稿，按 [AI_WRITING_GUIDE.md](AI_WRITING_GUIDE.md) 和 [自然写作规范](docs/writing-anti-ai-style.md) 完稿。内容围绕高中物理模型、易错点和实验题，讲清条件、原理与解题过程。

文件名决定文章 URL，例如 `force-analysis.md` 对应 `/blog/force-analysis/`。已发布文章保留文件名和 `pubDate`，实质修订时更新 `updatedAt`。

正常文章使用 `draft: false`；暂不公开的内容使用 `draft: true`。未来日期不会自动延迟发布。图片必须先保存真实文件，再引用 `/blog-images/<文章短名>/<图片名>`。

新增文章会自动进入列表、首页最新文章、RSS 和内容索引，不需要修改页面或登记文章。

## 构建与检查

```bash
npm run build
npm run verify
```

构建结果在 `dist/`。校验涵盖 Markdown 原文、公开文章清单、元数据、RSS、sitemap、图片和品牌资源。不要手改 `dist/` 或缓存。

修改页面、复制或图片逻辑后，运行浏览器检查：

```bash
npx playwright install chromium
npm run test:smoke
```

检查使用独立临时副本，覆盖桌面与移动端、草稿隔离、搜索分页、复制与分享功能，不改正式文章或系统剪贴板。

## 部署

站点通过 **Cloudflare Pages** 部署：代码托管在 GitHub（`oceankuku/tuitui-physics-blog`），推送 `main` 分支后自动执行构建并发布。构建命令为 `npm run build`，发布目录为 `dist`。

**推送前必须保证 `npm ci` 可通过**（Cloudflare 安装依赖用的就是它）：修改 `package.json` 依赖后，先运行 `npm install` 更新 `package-lock.json`，与源码一起提交。可在本地用 `npm ci --dry-run` 快速验证。

发布前配置真实域名、运行 `npm run brand:build` 并完成构建与校验。公众号复制中的图片地址与分享卡片二维码都依赖正式域名。

支持 `_headers` 的平台会读取项目响应头配置；其他平台需设置相应 MIME 类型。未知路径应返回 404。

## 维护文档

- [AGENTS.md](AGENTS.md)：协作规则与完成检查。
- [WORKBUDDY.md](WORKBUDDY.md)：常用维护任务入口。
- [主题与素材](docs/brand.md)：主题、头像和分享封面维护。
- [图片规则](docs/images.md)：原图、插图与分享卡片。
- [静态素材库](docs/materials.md)：图片展示、分类与维护。
- [搜索与 Markdown 入口](docs/seo-agent-access.md)：构建生成的公开入口。
- [公众号复制与微信分享](docs/wechat.md)：复制功能和可选微信配置。
