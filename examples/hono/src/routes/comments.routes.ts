import { createRoute, z } from '@node-openapi/hono';
import {
  commentSchema,
  newCommentSchema,
} from 'ws-common/domain/comment.domain';
import { defaultRouteSecurity } from './security';
import { errorsSchema } from './user.routes'; // Re-use error schemas

const unauthorizedResponse = {
  401: {
    description: 'Unauthorized',
    content: { 'application/json': { schema: errorsSchema } },
  },
};
const notFoundResponse = {
  404: {
    description: 'Article or Comment not found',
    content: { 'application/json': { schema: errorsSchema } },
  },
};
const validationErrorResponse = {
  422: {
    description: 'Validation Error',
    content: { 'application/json': { schema: errorsSchema } },
  },
};
const forbiddenResponse = {
  403: {
    description: 'Forbidden - User does not own the comment',
    content: { 'application/json': { schema: errorsSchema } },
  },
};

// --- Route Definitions ---

// Get Comments from Article
export const getCommentsRoute = createRoute({
  tags: ['Comments'],
  method: 'get',
  path: '/articles/{slug}/comments',
  description: 'Get all comments for an article.',
  request: {
    params: z.object({
      slug: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Successfully retrieved comments',
      content: {
        'application/json': {
          schema: z.object({ comments: z.array(commentSchema) }),
        },
      },
    },
    ...notFoundResponse, // If article with slug not found
  },
});

// Add Comment to Article
export const createCommentRoute = createRoute({
  tags: ['Comments'],
  method: 'post',
  path: '/articles/{slug}/comments',
  description: 'Add a new comment to an article.',
  security: defaultRouteSecurity,
  request: {
    params: z.object({
      slug: z.string(),
    }),
    body: {
      content: {
        'application/json': { schema: z.object({ comment: newCommentSchema }) },
      },
    },
  },
  responses: {
    201: {
      description: 'Comment created successfully',
      content: {
        'application/json': { schema: z.object({ comment: commentSchema }) },
      },
    },
    ...unauthorizedResponse,
    ...notFoundResponse, // If article with slug not found
    ...validationErrorResponse,
  },
});

// Delete Comment
export const deleteCommentRoute = createRoute({
  tags: ['Comments'],
  method: 'delete',
  path: '/articles/{slug}/comments/{id}', // id is comment id
  description: 'Delete a comment.',
  security: defaultRouteSecurity,
  request: {
    params: z.object({
      slug: z.string(),
      id: z.coerce.number().int(),
    }),
  },
  responses: {
    204: { description: 'Comment deleted successfully' }, // No content
    ...unauthorizedResponse,
    ...notFoundResponse, // If article or comment not found
    ...forbiddenResponse, // If user is not the author of the comment
  },
});
