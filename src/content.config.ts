import { defineCollection, z } from 'astro:content';
import { siteConfig } from '../site.config.mjs';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    pubDate: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    author: z.string().default(siteConfig.author),
    image: z.string().optional(),
    draft: z.boolean().default(false),
    // 自托管 MathJax 开关：仅试点/已改版文章置 true，其余文章不加载
    // 1.2MB 的 tex-mml-chtml.js，保持全站轻量（旧文仍用站内自建公式渲染）。
    mathjax: z.boolean().default(false),
  }),
});
export const collections = { blog };
