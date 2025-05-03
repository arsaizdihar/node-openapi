import { createRoute, z } from '@node-openapi/express';
import { profileSchema } from 'ws-common/domain/user.domain';

export const getProfileRoute = createRoute({
  tags: ['profile'],
  method: 'get',
  description: 'Get profile',
  path: '/profiles/{username}',
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
  path: '/profiles/{username}/follow',
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
  path: '/profiles/{username}/follow',
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
