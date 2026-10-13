# 待补信息备忘（不要提交到页面）

站点页面上不显示任何占位信息，以下内容等原老师提供后填入：

1. **真实域名** — 当前 `site.config.mjs` 里是 `https://example.com`。拿到域名后：
   - 改 `site.config.mjs` 的 `url`
   - 跑 `npm run brand:build`（分享封面带域名）
   - `npm run build && npm run verify`
2. **联系方式** — 微信号/邮箱/二维码任选，填到 `site.config.mjs` 的 `home.contacts`（自动出现在首页和导航）。
3. **作品/成果栏** — 如辅导案例、教学资料，填 `home.projects`（自动出现）。

## 双标签体系约定（2026-10-10 与原老师确认）

每篇文章 tags = [板块, 类型, 可选细分]：
- 板块：力学 / 热学 / 电磁学 / 光学 / 近代物理 / 方法与工具
- 类型：模型 / 易错点 / 实验题

首页「按教材板块找文章」区块的 TOPICS 列表（src/pages/index.astro）与博客列表 ?tag= 预筛选联动，新增板块要同步改两处。
