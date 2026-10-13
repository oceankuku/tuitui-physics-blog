import { getCollection } from 'astro:content';
import { siteConfig } from '../../site.config.mjs';

export const SITE = siteConfig.url;
export const SITE_NAME = siteConfig.name;
export function canonicalUrl(path: string) {
  const url = new URL(path, SITE);
  url.search = ''; url.hash = '';
  if (!/\.[a-z0-9]+$/i.test(url.pathname) && !url.pathname.endsWith('/')) url.pathname += '/';
  return url.href;
}
export function xml(value: string) {
  return value.replace(/[<>&"']/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]!);
}
export function jsonLd(value: unknown) { return JSON.stringify(value).replace(/</g, '\\u003c'); }

export async function contentCatalog() {
  return (await getCollection('blog')).filter((post) => !post.data.draft).map((post) => {
    const url = canonicalUrl(`/blog/${post.slug}`);
    return {
      id: `blog/${post.slug}`, kind: 'blog' as const, title: post.data.title,
      description: post.data.description, author: post.data.author, tags: post.data.tags,
      publishedAt: post.data.pubDate.toISOString(),
      updatedAt: (post.data.updatedAt ?? post.data.pubDate).toISOString(),
      url, markdownUrl: `${url}index.md`, image: post.data.image, body: post.body,
    };
  });
}
export type ContentItem = Awaited<ReturnType<typeof contentCatalog>>[number];
export function markdownDocument(entry: ContentItem) {
  return `# ${entry.title}\n\n作者：${entry.author}\n来源：${entry.url}\n发布：${entry.publishedAt}\n更新：${entry.updatedAt}\n\n${entry.description}\n\n---\n\n${entry.body}`;
}
export function articleSchema(props: { title: string; description: string; url: string; author?: string; image?: string; publishedAt?: Date; updatedAt?: Date; section: string }) {
  return {
    '@context': 'https://schema.org', '@type': 'BlogPosting', '@id': `${props.url}#article`,
    headline: props.title, description: props.description, inLanguage: siteConfig.language,
    mainEntityOfPage: { '@type': 'WebPage', '@id': props.url },
    author: { '@type': 'Person', name: props.author || siteConfig.author },
    image: new URL(props.image || siteConfig.ogImage, SITE).href,
    datePublished: props.publishedAt?.toISOString(), dateModified: props.updatedAt?.toISOString(),
    articleSection: props.section,
  };
}
