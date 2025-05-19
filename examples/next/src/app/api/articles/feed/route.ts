import { getArticlesFeed } from 'ws-common/service/articles.service';
import { createRequiredAuthFactory } from '../../factories';
import { articleSchema } from 'ws-common/domain/article.domain';
import { createRoute, z } from '@node-openapi/next';
import { defaultRouteSecurity } from '../../security';
import { articleFeedQuerySchema } from 'ws-common/domain/article.domain';
import { NextResponse } from 'next/server';

export const articleFeedController = createRequiredAuthFactory();

const getArticlesFeedRoute = createRoute({
  tags: ['articles'],
  method: 'get',
  path: '/articles/feed',
  description: 'Get articles feed',
  summary: 'Get articles feed',
  security: defaultRouteSecurity,
  request: {
    query: articleFeedQuerySchema,
  },
  responses: {
    200: {
      description: 'Articles feed',
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

articleFeedController.handler(getArticlesFeedRoute, async (req, ctx) => {
  const result = await getArticlesFeed(ctx.user, ctx.input.query);

  return NextResponse.json(result);
});

export const { GET } = articleFeedController.handlers;
