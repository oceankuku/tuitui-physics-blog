import { contentCatalog, SITE } from '../lib/site-content';
export async function GET() {
  const entries = (await contentCatalog()).map(({ body: _body, ...entry }) => entry);
  return new Response(JSON.stringify({ version: 1, site: SITE, entries }, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
