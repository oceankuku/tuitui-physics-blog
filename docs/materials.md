# 静态素材库

页面地址为 `/materials/`，通过站点导航中的“素材库”进入。支持分类、名称与文件名搜索、原图预览、下载、复制图片路径和 Markdown 引用。

## 图片目录

| 目录 | 分类 |
| --- | --- |
| `public/site-assets/` | 老师立绘 |
| `public/brand/`、`public/material-library/brand/` | 品牌图标 |
| `public/material-library/references/` | 角色参考 |
| `public/material-library/hero-physics-v1/`、`public/material-library/hero-physics-v2/` | Hero 横图 |
| `public/material-library/sprites/`、`public/material-library/models/` | 教学素材 |
| `public/blog-images/` | 文章配图 |

根目录的 `public/favicon.ico` 也会展示。图片内容完全相同时合并为一张，预览中的“其他引用位置”列出重复文件路径。

新图片放入对应目录后重新构建即可进入素材库。名称与 alt 在 `scripts/static-assets.mjs` 中维护，新图应补充准确的描述。只放入确认可以公开的图片。

## 原图与缩略图

原图保持原文件。素材库构建时自动派生 WebP 缩略图：Hero 横图最长边不超过 960px，其他图片不超过 480px，原图仅在打开预览时加载。缓存位于 `node_modules/.cache/static-asset-previews/`，构建自动复制到输出目录；不要手改缓存或 `dist/`。

## 来源记录

老师立绘、角色参考、课件头像、铁路像素图集及配色纹理已从 `wulike/videoclass` 复制到本站。导入路径与原图 SHA-256 记录在 `docs/static-assets-import.json`，项目运行和构建不依赖来源目录。

铁路像素图集的裁切、提示词与来源记录保存在 `public/material-library/sprites/railway-pixel-v1/`。模型配色纹理的许可与来源记录保存在 `public/material-library/models/train-kit/`；仅导入图片，未导入三维模型文件。两套素材的来源不同，不共用许可标注。

## Hero 横图

第一批 01–10 已补成完整课堂场景，沿用原文件路径；原留白版保存在本地 `workspace/image-notes/hero-physics-v1-originals/`，不随源码包交付。第二批 11–20 增加高中物理主题及侧身操作、俯身观察、坐姿记录、蹲下调仪器等动作。

两批的原图、尺寸、哈希、参考图与完整提示词分别记录在 `workspace/image-notes/hero-physics-v1.json` 和 `hero-physics-v2.json`。总览为 `workspace/image-notes/hero-physics-all-preview.html`，也可通过 `/materials/?category=hero` 查看。

## 检查

```bash
npm run build
npm run verify
npm run test:smoke
```

校验覆盖素材清单、缩略图、导入原图哈希。浏览器检查覆盖筛选搜索、预览、下载、路径与 Markdown 复制，以及桌面和手机显示。
