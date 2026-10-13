import { siteConfig } from '../../site.config.mjs';
import { contentCatalog, xml, SITE, SITE_NAME } from '../lib/site-content';
export async function GET() {
  const entries = (await contentCatalog()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const items = entries.map((entry) => `<item><title>${xml(entry.title)}</title><link>${xml(entry.url)}</link><guid isPermaLink="true">${xml(entry.url)}</guid><description>${xml(entry.description)}</description><pubDate>${new Date(entry.publishedAt ?? entry.updatedAt).toUTCString()}</pubDate><dc:date>${entry.updatedAt}</dc:date><dc:creator>${xml(entry.author)}</dc:creator>${entry.tags.map((tag) => `<category>${xml(tag)}</category>`).join('')}</item>`);
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel><title>${xml(SITE_NAME)}</title><link>${SITE}/</link><description>${xml(siteConfig.description)}</description><language>zh-CN</language><atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>${entries.length ? `<lastBuildDate>${new Date(entries[0].updatedAt).toUTCString()}</lastBuildDate>` : ''}${items.join('\n')}</channel></rss>`, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
