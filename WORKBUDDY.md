# 颓颓的物理碎碎念 · 维护任务

以本目录为工作目录，先读 `AGENTS.md`，运行与部署方式见 `README.md`。

## 维护站点信息

修改 `site.config.mjs` 中的站名、作者、域名或首页介绍。更新品牌派生图后构建、校验，不添加未经确认的个人信息。

## 写文章

先读 `AI_WRITING_GUIDE.md`、`BLOG_TEMPLATE.md` 和 `docs/writing-anti-ai-style.md`。根据指定主题或 `workspace/inbox/` 中的资料写作，正文保存到 `src/content/blog/`，原图保存到 `public/blog-images/` 对应目录。完成后通读、核对，运行构建与校验。

写完文章或做完优化后，构建校验通过即可提交并推送远程（`git push origin main`），Cloudflare Pages 会自动构建发布。推送前保证 `npm ci` 可通过：改过 `package.json` 依赖时先 `npm install` 更新 lock 文件一起提交。

## 配图

按 `docs/images.md` 操作，优先复用本站老师素材。需要新图时保留角色外观，保存原图及提示词、来源记录，再加入 Markdown。

## 修改文章

只修改指定文章与相关图片，保留已发布文件名和 `pubDate`。实质修订时更新 `updatedAt`，不手改 `dist/`。
