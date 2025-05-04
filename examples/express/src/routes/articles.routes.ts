import { createRoute } from '@node-openapi/express';
import { z } from 'zod';
import {
  articleFeedQuerySchema,
  articleQuerySchema,
  articleSchema,
  newArticleSchema,
  updateArticleSchema,
} from 'ws-common/domain/article.domain';
import { defaultRouteSecurity } from './security';
export const getArticlesFeedRoute = createRoute({
  tags: ['articles'],
  method: 'get',
  path: '/articles/feed',
  description: 'Get articles feed',
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

export const getArticlesRoute = createRoute({
  tags: ['articles'],
  method: 'get',
  path: '/articles',
  description: 'Get articles',
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

export const createArticleRoute = createRoute({
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

export const getArticleRoute = createRoute({
  tags: ['articles'],
  method: 'get',
  path: '/articles/{slug}',
  description: 'Get an article',
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

export const updateArticleRoute = createRoute({
  tags: ['articles'],
  method: 'put',
  path: '/articles/{slug}',
  description: 'Update an article',
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

export const deleteArticleRoute = createRoute({
  tags: ['articles'],
  method: 'delete',
  path: '/articles/{slug}',
  description: 'Delete an article',
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
