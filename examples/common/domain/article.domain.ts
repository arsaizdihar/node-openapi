import { z } from '@node-openapi/core';
import { profileSchema } from './user.domain';

export const articleSchema = z
  .object({
    slug: z.string(),
    title: z.string(),
    description: z.string(),
    body: z.string(),
    tagList: z.array(z.string()),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    favorited: z.boolean(),
    favoritesCount: z.number(),
    author: profileSchema,
  })
  .openapi('Article');

export type Article = z.infer<typeof articleSchema>;

export const newArticleSchema = z
  .object({
    title: z.string(),
    description: z.string(),
    body: z.string(),
    tagList: z.array(z.string()),
  })
  .openapi('NewArticle');

export type NewArticle = z.infer<typeof newArticleSchema>;

export const updateArticleSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    body: z.string().optional(),
  })
  .openapi('UpdateArticle');

export type UpdateArticle = z.infer<typeof updateArticleSchema>;

export const articleQuerySchema = z.object({
  tag: z.string().optional(),
  author: z.string().optional(),
  favorited: z.string().optional(),
  limit: z.coerce.number().optional(),
  offset: z.coerce.number().optional(),
});

export type ArticleQuery = z.infer<typeof articleQuerySchema>;

export const articleFeedQuerySchema = z.object({
  limit: z.coerce.number().optional(),
  offset: z.coerce.number().optional(),
});

export type ArticleFeedQuery = z.infer<typeof articleFeedQuerySchema>;
