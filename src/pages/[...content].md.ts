import type { APIRoute } from 'astro';
import { contentCatalog, markdownDocument } from '../lib/site-content';

export async function getStaticPaths() {
  return (await contentCatalog()).map((entry) => ({ params: { content: `${entry.id}/index` }, props: { entry } }));
}
export const GET: APIRoute = ({ props }) => new Response(markdownDocument(props.entry), {
  headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
});
