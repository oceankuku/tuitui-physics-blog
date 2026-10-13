# 搜索与 Markdown 入口

以下文件由构建生成，全部使用 `site.config.mjs` 的域名与作者信息：

| 入口 | 内容 |
| --- | --- |
| `/blog/<slug>/` | HTML 文章、canonical、结构化数据、OG/Twitter |
| `/blog/<slug>/index.md` | 带作者、来源与日期的 Markdown，正文与源文件一致 |
| `/materials/` | 静态图片素材库、分类搜索与原图预览 |
| `/content-index.json` | 公开文章清单、摘要、标签、日期、HTML 与 Markdown 地址 |
| `/llms.txt` | 给 Agent 的导航与 Markdown 阅读索引 |
| `/rss.xml` | 公开文章订阅 |
| `/sitemap.xml` | 首页、博客、静态素材库和公开文章 |
| `/robots.txt` | 搜索发现与模型训练策略 |

仅维护源 Markdown 和原图。不要人工登记文章数量，不改生成的 Markdown 或机器索引。`draft: true` 不进入公开入口。`updatedAt` 反映内容修改时间，不能使用部署时间。

## 验证

```bash
npm run build
npm run verify
```

也支持独立构建目录：

```bash
npm run build -- --outDir /tmp/physics-blog-check
python3 scripts/verify-seo.py /tmp/physics-blog-check
```

检查站点域名配置后，抽查：首页、文章 HTML、原文 Markdown、内容索引、RSS、sitemap、Logo、ICO、正文原图及 WebP。404 页面必须 noindex，不能冒充首页或正常文章。

静态托管应允许这些入口返回对应文件。`public/_headers` 是支持该格式的平台配置；其他平台需要设置等价的 MIME 类型。不要把所有未知路径回退为首页，这会掩盖不存在的文章和资源。

默认机器人规则允许普通搜索和 OAI-SearchBot，禁止 GPTBot 训练抓取；站主可根据自己的意愿修改 `src/pages/robots.txt.ts`。这不替代托管层的访问规则。
