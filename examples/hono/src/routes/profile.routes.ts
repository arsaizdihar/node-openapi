import { createRoute, z } from '@node-openapi/hono';
import { profileSchema } from 'ws-common/domain/user.domain';
import { defaultRouteSecurity } from './security';
import { errorsSchema } from './user.routes';

const usernameParam = z.object({ username: z.string() });

const notFoundResponse = {
  404: {
    description: 'Profile not found',
    content: { 'application/json': { schema: errorsSchema } },
  },
};

const unauthorizedResponse = {
  401: {
    description: 'Unauthorized',
    content: { 'application/json': { schema: errorsSchema } },
  },
};

export const getProfileRoute = createRoute({
  tags: ['Profile'],
  method: 'get',
  path: '/profiles/{username}',
  description: "Get a user's profile",
  request: {
    params: usernameParam,
  },
  responses: {
    200: {
      description: 'Profile retrieved successfully',
      content: {
        'application/json': { schema: z.object({ profile: profileSchema }) },
      },
    },
    ...notFoundResponse,
  },
});

export const followProfileRoute = createRoute({
  tags: ['Profile'],
  method: 'post',
  path: '/profiles/{username}/follow',
  description: 'Follow a user',
  security: defaultRouteSecurity,
  request: {
    params: usernameParam,
  },
  responses: {
    200: {
      description: 'Successfully followed user',
      content: {
        'application/json': { schema: z.object({ profile: profileSchema }) },
      },
    },
    ...unauthorizedResponse,
    ...notFoundResponse,
  },
});

export const unfollowProfileRoute = createRoute({
  tags: ['Profile'],
  method: 'delete',
  path: '/profiles/{username}/follow',
  description: 'Unfollow a user',
  security: defaultRouteSecurity,
  request: {
    params: usernameParam,
  },
  responses: {
    200: {
      description: 'Successfully unfollowed user',
      content: {
        'application/json': { schema: z.object({ profile: profileSchema }) },
      },
    },
    ...unauthorizedResponse,
    ...notFoundResponse,
  },
});
