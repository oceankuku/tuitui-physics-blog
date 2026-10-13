import { contentCatalog, canonicalUrl, xml } from '../lib/site-content';
export async function GET() {
  const pages = ['/', '/blog/', '/materials/'].map((path) => `<url><loc>${xml(canonicalUrl(path))}</loc></url>`);
  for (const entry of await contentCatalog()) pages.push(`<url><loc>${xml(entry.url)}</loc><lastmod>${entry.updatedAt}</lastmod></url>`);
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.join('\n')}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
