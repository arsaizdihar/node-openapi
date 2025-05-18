import { createRoute, z } from '@node-openapi/hapi';
import {
  commentSchema,
  newCommentSchema,
} from 'ws-common/domain/comment.domain';
import { defaultRouteSecurity } from './security';

export const getCommentsRoute = createRoute({
  tags: ['comments'],
  method: 'get',
  path: '/articles/{slug}/comments',
  description: 'Get comments',
  summary: 'Get comments',
  security: defaultRouteSecurity,
  request: {
    params: z.object({
      slug: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Comments',
      content: {
        'application/json': {
          schema: z.object({
            comments: z.array(commentSchema),
          }),
        },
      },
    },
  },
});

export const createCommentRoute = createRoute({
  tags: ['comments'],
  method: 'post',
  path: '/articles/{slug}/comments',
  description: 'Create a comment',
  summary: 'Create a comment',
  security: defaultRouteSecurity,
  request: {
    params: z.object({
      slug: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            comment: newCommentSchema,
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Comment created',
      content: {
        'application/json': {
          schema: z.object({
            comment: commentSchema,
          }),
        },
      },
    },
  },
});

export const deleteCommentRoute = createRoute({
  tags: ['comments'],
  method: 'delete',
  path: '/articles/{slug}/comments/{id}',
  description: 'Delete a comment',
  summary: 'Delete a comment',
  security: defaultRouteSecurity,
  request: {
    params: z.object({
      slug: z.string(),
      id: z.coerce.number().int(),
    }),
  },
  responses: {
    200: {
      description: 'Comment deleted',
    },
  },
});
