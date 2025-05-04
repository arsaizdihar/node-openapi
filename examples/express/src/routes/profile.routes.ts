import { createRoute, z } from '@node-openapi/express';
import { profileSchema } from 'ws-common/domain/user.domain';
import { defaultRouteSecurity } from './security';

export const getProfileRoute = createRoute({
  tags: ['profile'],
  method: 'get',
  description: 'Get profile',
  summary: 'Get profile',
  path: '/profiles/{username}',
  security: defaultRouteSecurity,
  request: {
    params: z.object({ username: z.string() }),
  },
  responses: {
    200: {
      description: 'Profile',
      content: {
        'application/json': { schema: z.object({ profile: profileSchema }) },
      },
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

export const followProfileRoute = createRoute({
  tags: ['profile'],
  method: 'post',
  description: 'Follow profile',
  summary: 'Follow profile',
  path: '/profiles/{username}/follow',
  security: defaultRouteSecurity,
  request: {
    params: z.object({ username: z.string() }),
  },
  responses: {
    200: {
      description: 'Profile followed',
      content: {
        'application/json': { schema: z.object({ profile: profileSchema }) },
      },
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

export const unfollowProfileRoute = createRoute({
  tags: ['profile'],
  method: 'delete',
  description: 'Unfollow profile',
  summary: 'Unfollow profile',
  path: '/profiles/{username}/follow',
  security: defaultRouteSecurity,
  request: {
    params: z.object({ username: z.string() }),
  },
  responses: {
    200: {
      description: 'Profile unfollowed',
      content: {
        'application/json': { schema: z.object({ profile: profileSchema }) },
      },
    },
    401: {
      description: 'Unauthorized',
    },
  },
});
