import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkDirective from 'remark-directive';
import rehypeRaw from 'rehype-raw';
import { siteConfig } from './site.config.mjs';
import { contentImages, contentImageAssets, formulaBlocks, plainDirectives } from './scripts/content-images.mjs';
import { staticAssetPreviews } from './scripts/static-assets.mjs';
import { materialsManager } from './scripts/materials-manager.mjs';

export default defineConfig({
  site: siteConfig.url,
  integrations: [mdx(), contentImageAssets(), staticAssetPreviews()],
  markdown: {
    // allowDangerousHtml: 让 remark-rehype 保留 formulaBlocks 产出的 html 节点，
    // 再由 rehype-raw 解析成真实 <span>（根号/竖式分数）。rehype-raw 必须在
    // contentImages 之前，否则后者看不到已展开的 span 元素。
    remarkRehype: { allowDangerousHtml: true },
    remarkPlugins: [remarkDirective, formulaBlocks, plainDirectives],
    rehypePlugins: [rehypeRaw, contentImages],
  },
  build: { format: 'directory' },
  vite: { build: { assetsInlineLimit: 0 }, plugins: [materialsManager()] },
});
