import { createRoute, NextRouteFactory, z } from '@node-openapi/next';
import { defaultRouteSecurity } from '../../security';
import {
  articleSchema,
  updateArticleSchema,
} from 'ws-common/domain/article.domain';
import { NextResponse } from 'next/server';
import {
  deleteArticle,
  getArticle,
  updateArticle,
} from 'ws-common/service/articles.service';
import {
  createOptionalAuthFactory,
  createRequiredAuthFactory,
} from '../../factories';
import { articleFavoriteController } from './favorite/route';
import { articleCommentsController } from './comments/route';

export const articleSlugController = new NextRouteFactory();
const optionalAuthFactory = createOptionalAuthFactory();
const requiredAuthFactory = createRequiredAuthFactory();

const getArticleRoute = createRoute({
  tags: ['articles'],
  method: 'get',
  path: '/articles/{slug}',
  description: 'Get an article',
  summary: 'Get an article',
  security: defaultRouteSecurity,
  request: {
    params: z.object({
      slug: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Article',
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
    404: {
      description: 'Article not found',
    },
  },
});

const updateArticleRoute = createRoute({
  tags: ['articles'],
  method: 'put',
  path: '/articles/{slug}',
  description: 'Update an article',
  summary: 'Update an article',
  security: defaultRouteSecurity,
  request: {
    params: z.object({
      slug: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            article: updateArticleSchema,
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Article updated',
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
    404: {
      description: 'Article not found',
    },
  },
});

const deleteArticleRoute = createRoute({
  tags: ['articles'],
  method: 'delete',
  path: '/articles/{slug}',
  description: 'Delete an article',
  summary: 'Delete an article',
  security: defaultRouteSecurity,
  request: {
    params: z.object({
      slug: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Article deleted',
    },
  },
});

optionalAuthFactory.handler(getArticleRoute, async (req, ctx) => {
  const result = await getArticle(ctx.input.param.slug, ctx.user ?? undefined);

  return NextResponse.json(result);
});

requiredAuthFactory.handler(updateArticleRoute, async (req, ctx) => {
  const result = await updateArticle(
    ctx.user,
    ctx.input.param.slug,
    ctx.input.json.article,
  );

  return NextResponse.json(result);
});

requiredAuthFactory.handler(deleteArticleRoute, async (req, ctx) => {
  await deleteArticle(ctx.user, ctx.input.param.slug);

  return NextResponse.json({});
});

export const { GET, PUT, DELETE } = articleSlugController
  .merge(optionalAuthFactory)
  .merge(requiredAuthFactory)
  .router(articleFavoriteController)
  .router(articleCommentsController).handlers;
