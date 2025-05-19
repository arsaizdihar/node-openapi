import { createRoute, NextRouteFactory, z } from '@node-openapi/next';
import { NextResponse } from 'next/server';
import {
  articleQuerySchema,
  articleSchema,
  newArticleSchema,
} from 'ws-common/domain/article.domain';
import { createArticle, getArticles } from 'ws-common/service/articles.service';
import {
  createOptionalAuthFactory,
  createRequiredAuthFactory,
} from '../factories';
import { defaultRouteSecurity } from '../security';
import { articleFeedController } from './feed/route';
import { articleSlugController } from './[slug]/route';

export const articlesController = new NextRouteFactory();
const optionalAuthFactory = createOptionalAuthFactory();
const requiredAuthFactory = createRequiredAuthFactory();

const getArticlesRoute = createRoute({
  tags: ['articles'],
  method: 'get',
  path: '/articles',
  description: 'Get articles',
  summary: 'Get articles',
  security: defaultRouteSecurity,
  request: {
    query: articleQuerySchema,
  },
  responses: {
    200: {
      description: 'Articles',
      content: {
        'application/json': {
          schema: z.object({
            articles: z.array(articleSchema),
            articlesCount: z.number(),
          }),
        },
      },
    },
  },
});

const createArticleRoute = createRoute({
  tags: ['articles'],
  method: 'post',
  path: '/articles',
  description: 'Create an article',
  security: defaultRouteSecurity,
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            article: newArticleSchema,
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Article created',
      content: {
        'application/json': {
          schema: z.object({
            article: articleSchema,
          }),
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

optionalAuthFactory.handler(getArticlesRoute, async (req, ctx) => {
  const result = await getArticles(ctx.user ?? undefined, ctx.input.query);
  return NextResponse.json(result);
});

requiredAuthFactory.handler(createArticleRoute, async (req, ctx) => {
  const result = await createArticle(ctx.user, ctx.input.json.article);
  return NextResponse.json(result);
});

export const { GET, POST } = articlesController
  .merge(optionalAuthFactory)
  .merge(requiredAuthFactory)
  .router(articleFeedController)
  .router(articleSlugController).handlers;
