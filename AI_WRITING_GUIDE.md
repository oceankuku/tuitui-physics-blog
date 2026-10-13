# 颓颓的物理碎碎念 · 写作指南

本站由颓頹老师分享高中物理模型、易错点与实验题。用自然的讲解口吻，把适用条件、推理过程和容易出错的地方说清楚。

## 写作流程

1. 读取用户给的资料，先分清事实和推测。
2. 从 `BLOG_TEMPLATE.md` 的 frontmatter 起稿，把占位日期改为真实日期。
3. 在 `src/content/blog/` 新建 Markdown。文件名成为 URL，例如 `first-note.md` 对应 `/blog/first-note/`。
4. 原图放在 `public/blog-images/first-note/`，正文引用 `/blog-images/first-note/xxx.png`。
5. 通读、核对后运行 `npm run build` 和 `npm run verify`。

站名、默认作者、域名、首页简介、作品、能力与联系入口都在 `site.config.mjs`。文章不用注册到列表，不用写页面代码，不用手工修改任何索引。

## Frontmatter

```yaml
---
title: "文章标题"
description: "准确概括文章的一句话"
pubDate: 2026-10-10
draft: false
tags: ["主题", "学习笔记"]
# image: /blog-images/first-note/cover.png
# author: "作者" # 省略时用站点默认作者
# updatedAt: 2026-10-11 # 仅实质修订旧文时填写
---
```

`title`、`description`、`pubDate` 必填。`image` 是社交分享封面；如果要在正文显示，也要单独插入 Markdown 图片。日期不能用部署时间替代。`draft: true` 会同时排除 HTML 文章页、Markdown 导出、RSS、sitemap 和内容索引。

## 正文

- 不再写一级标题。使用 `##`、`###` 建立阅读目录。
- 自然地展开问题和判断，不强制每篇都有引言、总结、FAQ。
- 代码块注明语言；表格、引用、图片使用标准 Markdown。
- 正文图自动派生 WebP、srcset、尺寸及加载属性。保留原图，生成文件不手改。
- 相对链接可用于页面跳转；图片统一使用站点根路径，方便 HTML、Markdown 和公众号复制共用。
- 需要复杂公式或交互时先评估当前渲染能力。本项目没有预装数学公式、Mermaid 或课堂播放器；不能把普通代码块当成已渲染的图。

## 文字与素材

按 `docs/writing-anti-ai-style.md` 通读，避免固定句式、宣传性评价、过度加粗和刻意金句。没法从资料确定的信息要标明，不能虚构统计、教学结果或案例。

图片与视觉资产按 `docs/images.md` 操作，先保存原图，再写入真实图片路径。

## 发布入口

自动生成的入口见 `docs/seo-agent-access.md`。当前配置域名是 `https://example.com`，正式发布前必须更改 `site.config.mjs` 的域名并重新构建。
