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
  }),
});
export const collections = { blog };
