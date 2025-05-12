import { createRoute, z } from '@node-openapi/hono';
import {
  articleSchema,
  multipleArticlesSchema,
  newArticleSchema,
  updateArticleSchema,
} from 'ws-common/domain/article.domain';
import { defaultRouteSecurity } from './security';
import { errorsSchema } from './user.routes';

const slugParam = z.object({
  slug: z.string().openapi({ example: 'how-to-train-your-dragon' }),
});
const unauthorizedResponse = {
  401: {
    description: 'Unauthorized',
    content: { 'application/json': { schema: errorsSchema } },
  },
};
const notFoundResponse = {
  404: {
    description: 'Article not found',
    content: { 'application/json': { schema: errorsSchema } },
  },
};
const validationErrorResponse = {
  422: {
    description: 'Validation Error',
    content: { 'application/json': { schema: errorsSchema } },
  },
};

// --- Route Definitions ---

// List Articles
export const listArticlesRoute = createRoute({
  tags: ['Articles'],
  method: 'get',
  path: '/articles',
  description:
    'List all articles. Supports filtering by tag, author, and favorited user. Supports pagination.',
  request: {
    query: z.object({
      tag: z.string().optional().openapi({ example: 'dragons' }),
      author: z.string().optional().openapi({ example: 'jake' }),
      favorited: z.string().optional().openapi({ example: 'jake' }),
      limit: z.coerce
        .number()
        .int()
        .positive()
        .optional()
        .default(20)
        .openapi({ example: 20 }),
      offset: z.coerce
        .number()
        .int()
        .nonnegative()
        .optional()
        .default(0)
        .openapi({ example: 0 }),
    }),
  },
  responses: {
    200: {
      description: 'Successfully retrieved articles',
      content: { 'application/json': { schema: multipleArticlesSchema } },
    },
    ...validationErrorResponse,
  },
});

// Feed Articles
export const feedArticlesRoute = createRoute({
  tags: ['Articles'],
  method: 'get',
  path: '/articles/feed',
  description:
    'List articles from users the current user follows. Supports pagination.',
  security: defaultRouteSecurity,
  request: {
    query: z.object({
      limit: z.coerce.number().int().positive().optional().default(20),
      offset: z.coerce.number().int().nonnegative().optional().default(0),
    }),
  },
  responses: {
    200: {
      description: 'Successfully retrieved feed articles',
      content: { 'application/json': { schema: multipleArticlesSchema } },
    },
    ...unauthorizedResponse,
    ...validationErrorResponse,
  },
});

export const getArticleRoute = createRoute({
  tags: ['Articles'],
  method: 'get',
  path: '/articles/{slug}',
  description: 'Get a single article by its slug.',
  request: {
    params: slugParam,
  },
  responses: {
    200: {
      description: 'Successfully retrieved article',
      content: {
        'application/json': { schema: z.object({ article: articleSchema }) },
      },
    },
    ...notFoundResponse,
  },
});

// Create Article
export const createArticleRoute = createRoute({
  tags: ['Articles'],
  method: 'post',
  path: '/articles',
  description: 'Create a new article.',
  security: defaultRouteSecurity,
  request: {
    body: {
      content: {
        'application/json': { schema: z.object({ article: newArticleSchema }) },
      },
    },
  },
  responses: {
    201: {
      description: 'Article created successfully',
      content: {
        'application/json': { schema: z.object({ article: articleSchema }) },
      },
    },
    ...unauthorizedResponse,
    ...validationErrorResponse,
  },
});

// Update Article
export const updateArticleRoute = createRoute({
  tags: ['Articles'],
  method: 'put',
  path: '/articles/{slug}',
  description: 'Update an article.',
  security: defaultRouteSecurity,
  request: {
    params: slugParam,
    body: {
      content: {
        'application/json': {
          schema: z.object({ article: updateArticleSchema }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Article updated successfully',
      content: {
        'application/json': { schema: z.object({ article: articleSchema }) },
      },
    },
    ...unauthorizedResponse,
    ...notFoundResponse,
    ...validationErrorResponse,
  },
});

export const deleteArticleRoute = createRoute({
  tags: ['Articles'],
  method: 'delete',
  path: '/articles/{slug}',
  description: 'Delete an article.',
  security: defaultRouteSecurity,
  request: {
    params: slugParam,
  },
  responses: {
    204: { description: 'Article deleted successfully' },
    ...unauthorizedResponse,
    ...notFoundResponse,
  },
});

export const favoriteArticleRoute = createRoute({
  tags: ['Articles'],
  method: 'post',
  path: '/articles/{slug}/favorite',
  description: 'Favorite an article.',
  security: defaultRouteSecurity,
  request: {
    params: slugParam,
  },
  responses: {
    200: {
      description: 'Successfully favorited article',
      content: {
        'application/json': { schema: z.object({ article: articleSchema }) },
      },
    },
    ...unauthorizedResponse,
    ...notFoundResponse,
  },
});

// Unfavorite Article
export const unfavoriteArticleRoute = createRoute({
  tags: ['Articles'],
  method: 'delete',
  path: '/articles/{slug}/favorite',
  description: 'Unfavorite an article.',
  security: defaultRouteSecurity,
  request: {
    params: slugParam,
  },
  responses: {
    200: {
      description: 'Successfully unfavorited article',
      content: {
        'application/json': { schema: z.object({ article: articleSchema }) },
      },
    },
    ...unauthorizedResponse,
    ...notFoundResponse,
  },
});
