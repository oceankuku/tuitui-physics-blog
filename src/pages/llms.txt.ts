import { contentCatalog, SITE, SITE_NAME } from '../lib/site-content';
import { siteConfig } from '../../site.config.mjs';
export async function GET() {
  const entries = await contentCatalog();
  const articles = entries.map((entry) => `- [${entry.title.replace(/[\[\]\n]/g, ' ')}](${entry.markdownUrl}): ${entry.description.replace(/\n/g, ' ')}`).join('\n');
  return new Response(`# ${SITE_NAME}\n\n> ${siteConfig.description}\n\n公开文章提供 HTML 与 Markdown 两种形式，来自同一份源文件。\n\n## 导航\n\n- [首页](${SITE}/)\n- [博客](${SITE}/blog/)\n- [静态素材库](${SITE}/materials/)\n- [内容索引](${SITE}/content-index.json)\n- [RSS](${SITE}/rss.xml)\n- [站点地图](${SITE}/sitemap.xml)\n\n## 文章\n\n${articles}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
