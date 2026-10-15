import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkDirective from 'remark-directive';
import { siteConfig } from './site.config.mjs';
import { contentImages, contentImageAssets, formulaBlocks, plainDirectives } from './scripts/content-images.mjs';
import { staticAssetPreviews } from './scripts/static-assets.mjs';
import { materialsManager } from './scripts/materials-manager.mjs';

export default defineConfig({
  site: siteConfig.url,
  integrations: [mdx(), contentImageAssets(), staticAssetPreviews()],
  markdown: {
    remarkPlugins: [remarkDirective, formulaBlocks, plainDirectives],
    rehypePlugins: [contentImages],
  },
  build: { format: 'directory' },
  vite: { build: { assetsInlineLimit: 0 }, plugins: [materialsManager()] },
});
