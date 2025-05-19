import { createRequiredAuthFactory } from '@/app/api/factories';
import { defaultRouteSecurity } from '@/app/api/security';
import { createRoute, z } from '@node-openapi/next';
import { NextResponse } from 'next/server';
import { articleSchema } from 'ws-common/domain/article.domain';
import {
  favoriteArticle,
  unfavoriteArticle,
} from 'ws-common/service/articles.service';

export const articleFavoriteController = createRequiredAuthFactory();

const favoriteArticleRoute = createRoute({
  tags: ['favorites'],
  method: 'post',
  path: '/articles/{slug}/favorite',
  description: 'Favorite an article',
  summary: 'Favorite an article',
  security: defaultRouteSecurity,
  request: {
    params: z.object({
      slug: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Article favorited',
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

const unfavoriteArticleRoute = createRoute({
  tags: ['favorites'],
  method: 'delete',
  path: '/articles/{slug}/favorite',
  description: 'Unfavorite an article',
  summary: 'Unfavorite an article',
  security: defaultRouteSecurity,
  request: {
    params: z.object({
      slug: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Article unfavorited',
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

articleFavoriteController.handler(favoriteArticleRoute, async (req, ctx) => {
  const result = await favoriteArticle(ctx.user, ctx.input.param.slug);

  return NextResponse.json(result);
});

articleFavoriteController.handler(unfavoriteArticleRoute, async (req, ctx) => {
  const result = await unfavoriteArticle(ctx.user, ctx.input.param.slug);

  return NextResponse.json(result);
});

export const { POST, DELETE } = articleFavoriteController.handlers;
